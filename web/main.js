// Point d'entrée de la version web d'OndeTV : sert l'application (dossier public/) et le relais /x.
// Déploiement : Deno Deploy (entrypoint web/main.js) ou en local : deno run -A web/main.js
import { handleProxy } from "./proxy.js";
import { handleSync } from "./sync.js";
import { handleEpg, ensureLoaded as loadPublicEpg } from "./epg.js";

const env = (name) => globalThis.Deno?.env.get(name);
const config = {
  // Définissez PROXY_SECRET dans les variables d'environnement de l'hébergeur.
  secret: env("PROXY_SECRET") || "ondetv-change-me",
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

export async function handler(request) {
  const { pathname } = new URL(request.url);
  if (pathname === "/x") return handleProxy(request, config);
  if (pathname === "/diag") return diag();
  if (pathname === "/tv" || pathname === "/tv.apk" || pathname === "/OndeTV.apk") return androidApk();
  if (pathname.startsWith("/sync/")) return handleSync(request);
  if (pathname.startsWith("/epg/")) return handleEpg(request);
  return serveStatic(pathname);
}

if (import.meta.main) {
  const port = Number(env("PORT") || 8000);
  Deno.serve({ port }, handler);
  // Guides publics chargés en arrière-plan dès le démarrage.
  if (env("PUBLIC_EPG") !== "off") loadPublicEpg().catch(() => {});
}
