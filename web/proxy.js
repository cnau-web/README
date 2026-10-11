// Relais HTTPS → serveur Xtream (souvent en HTTP) pour la version web d'OndeTV.
// Code portable (API Web standard) : Deno Deploy, Deno, ou tout runtime avec fetch/crypto.subtle.
//
// Sécurité : sans signature, le relais n'accepte que les URL d'entrée Xtream
// (player_api.php, /live/, /movie/, /series/, /timeshift/) et les images.
// Les segments HLS, réécrits par le relais, portent une signature HMAC.

const ENTRY_PATH = /(\/player_api\.php$|^\/(live|movie|series|timeshift)\/|\/streaming\/timeshift\.php$)/i;
const PASS_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"];

const encoder = new TextEncoder();
const keyCache = new Map();

async function hmacKey(secret) {
  if (!keyCache.has(secret)) {
    keyCache.set(secret, crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]));
  }
  return keyCache.get(secret);
}

export async function sign(url, secret) {
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(url));
  return [...new Uint8Array(mac).slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function proxiedURL(target, secret) {
  return `/x?url=${encodeURIComponent(target)}&s=${await sign(target, secret)}`;
}

export function isPlaylist(url, contentType) {
  const ct = (contentType || "").toLowerCase();
  return ct.includes("mpegurl") || /\.m3u8?$/i.test(new URL(url).pathname);
}

/** Réécrit chaque URI d'une playlist HLS pour qu'elle repasse par le relais. */
export async function rewritePlaylist(body, baseURL, secret) {
  const lines = body.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { out.push(line); continue; }
    if (trimmed.startsWith("#")) {
      const matches = [...trimmed.matchAll(/URI="([^"]+)"/g)];
      let rewritten = trimmed;
      for (const m of matches) {
        const abs = new URL(m[1], baseURL).href;
        rewritten = rewritten.replace(m[0], `URI="${await proxiedURL(abs, secret)}"`);
      }
      out.push(rewritten);
    } else {
      out.push(await proxiedURL(new URL(trimmed, baseURL).href, secret));
    }
  }
  return out.join("\n");
}

export async function handleProxy(request, { secret, userAgent }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Méthode non autorisée", { status: 405 });
  }
  const params = new URL(request.url).searchParams;
  const raw = params.get("url");
  let target;
  try {
    target = new URL(raw);
    if (target.protocol !== "http:" && target.protocol !== "https:") throw new Error();
  } catch {
    return new Response("URL invalide", { status: 400 });
  }

  const signed = params.get("s") === (await sign(target.href, secret));
  const entry = ENTRY_PATH.test(target.pathname);

  const headers = new Headers({ "User-Agent": userAgent, "Accept": "*/*" });
  const range = request.headers.get("range");
  if (range) headers.set("Range", range);

  let upstream;
  try {
    upstream = await fetch(target.href, { method: request.method, headers, redirect: "follow" });
  } catch (e) {
    return new Response(`Serveur injoignable : ${e.message}`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!signed && !entry && !contentType.toLowerCase().startsWith("image/")) {
    upstream.body?.cancel();
    return new Response("Interdit", { status: 403 });
  }

  const finalURL = upstream.url || target.href;
  if (upstream.ok && request.method === "GET" && isPlaylist(finalURL, contentType)) {
    const text = await upstream.text();
    if (text.trimStart().startsWith("#EXTM3U")) {
      return new Response(await rewritePlaylist(text, finalURL, secret), {
        status: 200,
        headers: { "content-type": "application/vnd.apple.mpegurl", "cache-control": "no-store" },
      });
    }
    return new Response(text, { status: upstream.status, headers: { "content-type": contentType } });
  }

  const out = new Headers({ "cache-control": contentType.startsWith("image/") ? "public, max-age=86400" : "no-store" });
  for (const h of PASS_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
