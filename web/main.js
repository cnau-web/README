// Point d'entrée de la version web d'OndeTV : sert l'application (dossier public/) et le relais /x.
// Déploiement : Deno Deploy (entrypoint web/main.js) ou en local : deno run -A web/main.js
import { handleProxy } from "./proxy.js";

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

export async function handler(request) {
  const { pathname } = new URL(request.url);
  if (pathname === "/x") return handleProxy(request, config);
  if (pathname === "/diag") return diag();
  return serveStatic(pathname);
}

if (import.meta.main) {
  const port = Number(env("PORT") || 8000);
  Deno.serve({ port }, handler);
}
