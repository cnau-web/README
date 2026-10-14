// Point d'entrée de la version web d'OndeTV : sert l'application (dossier public/) et le relais /x.
// Déploiement : Deno Deploy (entrypoint web/main.js) ou en local : deno run -A web/main.js
import { handleProxy } from "./proxy.js";
import { handleSync } from "./sync.js";
import { handleM3U } from "./m3u.js";
import { handleEpg, ensureLoaded as loadPublicEpg } from "./epg.js";
import { allow, clientIP, tooMany, APP_CSP, COMMON_HEADERS, RELAY_HEADERS, withHeaders } from "./security.js";

const env = (name) => globalThis.Deno?.env.get(name);
const config = {
  // Définissez PROXY_SECRET dans les variables d'environnement de l'hébergeur.
  secret: env("PROXY_SECRET") || crypto.randomUUID(), // jamais de clé connue par défaut
  userAgent: env("UPSTREAM_USER_AGENT") || "OndeTV/1.0",
};

const PUBLIC_DIR = new URL("./public/", import.meta.url);
const TYPES = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  webmanifest: "application/manifest+json",
  png: "image/png",
  svg: "image/svg+xml",
};

async function serveStatic(pathname) {
  const clean = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  if (clean.includes("..")) return new Response("Introuvable", { status: 404 });
  try {
    const data = await Deno.readFile(new URL(clean, PUBLIC_DIR));
    const ext = clean.split(".").pop();
    return new Response(data, {
      headers: {
        "content-type": TYPES[ext] || "application/octet-stream",
        "cache-control": ext === "png" ? "public, max-age=604800" : "no-cache",
        ...(ext === "html" ? { "content-security-policy": APP_CSP } : {}),
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}

let diagCache = null;
async function diag() {
  if (!diagCache) {
    const info = await fetch("https://ipinfo.io/json", { signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => ({}));
    diagCache = { location: [info.city, info.region, info.country].filter(Boolean).join(", ") || "inconnu", country: info.country || null };
  }
  return Response.json(diagCache, { headers: { "cache-control": "no-store" } });
}

// App Android TV : adresse courte à taper dans Downloader (ondetv.onrender.com/tv).
// Le fichier est publié par GitHub Actions (release « android-latest ») et relayé ici avec le bon type.
const APK_URL = "https://github.com/cnau-web/README/releases/download/android-latest/OndeTV.apk";
let apkCache = null;
let versionCache = null;
async function androidVersion() {
  const ttl = versionCache?.data?.versionCode ? 10 * 60000 : 60000; // un échec n'est gardé qu'une minute
  if (!versionCache || Date.now() - versionCache.at > ttl) {
    const res = await fetch(APK_URL.replace("OndeTV.apk", "version.json"), { signal: AbortSignal.timeout(15000) }).catch(() => null);
    const data = res?.ok ? await res.json().catch(() => null) : null;
    versionCache = { at: Date.now(), data: data || { versionCode: 0 } };
  }
  return Response.json(versionCache.data, { headers: { "cache-control": "no-store" } });
}

async function androidApk() {
  if (!apkCache || Date.now() - apkCache.at > 10 * 60000) {
    const res = await fetch(APK_URL, { signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (!res?.ok) return new Response("L'app Android TV n'est pas encore publiée. Réessayez dans quelques minutes.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    apkCache = { at: Date.now(), data: new Uint8Array(await res.arrayBuffer()) };
  }
  return new Response(apkCache.data, { headers: {
    "content-type": "application/vnd.android.package-archive",
    "content-disposition": 'attachment; filename="OndeTV.apk"',
    "cache-control": "no-store",
  } });
}

async function route(request, info) {
  const url = new URL(request.url);
  const { pathname } = url;
  const ip = clientIP(request, info);
  // Écritures acceptées seulement depuis l'app elle-même (pas depuis un autre site).
  const origin = request.headers.get("origin");
  if (origin && request.method !== "GET" && request.method !== "HEAD" && new URL(origin).host !== url.host) {
    return new Response("Origine refusée", { status: 403 });
  }
  if (pathname === "/x") {
    const signed = url.searchParams.has("s");
    // Les segments vidéo signés ne sont pas limités (lecture) ; le reste l'est, largement.
    if (!signed && !allow(`x:${ip}`, 1500)) return tooMany();
    const res = await handleProxy(request, config);
    const out = withHeaders(res, RELAY_HEADERS);
    // Une page HTML venue d'un serveur extérieur n'est jamais affichée comme une page de notre site.
    const ct = out.headers.get("content-type") || "";
    if (/html|xml|javascript/i.test(ct) && !/mpegurl/i.test(ct)) out.headers.set("content-type", "text/plain; charset=utf-8");
    return out;
  }
  if (pathname === "/diag") return diag();
  if (pathname === "/m3u") {
    if (!allow(`m3u:${ip}`, 20)) return tooMany();
    return handleM3U(request, config.secret);
  }
  if (pathname === "/tv" || pathname === "/tv.apk" || pathname === "/OndeTV.apk") {
    if (!allow(`apk:${ip}`, 10)) return tooMany();
    return androidApk();
  }
  if (pathname === "/tv/version") return androidVersion();
  if (pathname.startsWith("/sync/")) {
    if (!allow(`sync:${ip}`, request.method === "PUT" ? 30 : 120)) return tooMany();
    return handleSync(request);
  }
  if (pathname.startsWith("/epg/")) {
    if (!allow(`epg:${ip}`, pathname === "/epg/provider" ? 20 : 240)) return tooMany();
    return handleEpg(request);
  }
  return serveStatic(pathname);
}

export async function handler(request, info) {
  const res = await route(request, info);
  return withHeaders(res, COMMON_HEADERS);
}

if (import.meta.main) {
  const port = Number(env("PORT") || 8000);
  Deno.serve({ port }, handler);
  // Guides publics chargés en arrière-plan dès le démarrage.
  if (env("PUBLIC_EPG") !== "off") loadPublicEpg().catch(() => {});
}
