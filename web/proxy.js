// Relais HTTPS → serveur Xtream (souvent en HTTP) pour la version web d'OndeTV.
// Code portable (API Web standard) : Deno Deploy, Deno, ou tout runtime avec fetch/crypto.subtle.
//
// Sécurité : sans signature, le relais n'accepte que les URL d'entrée Xtream
// (player_api.php, /live/, /movie/, /series/, /timeshift/) et les images.
// Les segments HLS, réécrits par le relais, portent une signature HMAC.

import { safeFetch } from "./security.js";

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

// ---------------------------------------------------------------- cache des segments vidéo
// Le relais télécharge à l'avance les derniers segments annoncés par chaque playlist HLS et les garde
// quelques dizaines de secondes en mémoire : le lecteur les reçoit sans attendre le serveur IPTV,
// ce qui évite les micro-coupures quand le serveur ou le réseau est lent.

const SEGMENT_TTL = 90_000;
const CACHE_MAX_BYTES = 64 * 1024 * 1024;
const SEGMENT_MAX_BYTES = 12 * 1024 * 1024;
const segments = new Map(); // url -> { at, promise, entry }
let cachedBytes = 0;

function evict() {
  const now = Date.now();
  for (const [url, item] of segments) {
    const tooOld = now - item.at > SEGMENT_TTL;
    if (tooOld || cachedBytes > CACHE_MAX_BYTES) {
      if (item.entry) cachedBytes -= item.entry.body.byteLength;
      segments.delete(url);
    } else if (!tooOld && cachedBytes <= CACHE_MAX_BYTES) break; // Map = ordre d'insertion : le reste est plus récent
  }
}

function fetchSegment(url, userAgent) {
  const hit = segments.get(url);
  if (hit) return hit.promise;
  const promise = (async () => {
    const res = await safeFetch(url, { headers: { "User-Agent": userAgent, "Accept": "*/*" }, signal: AbortSignal.timeout(20_000) });
    const length = Number(res.headers.get("content-length") || 0);
    if (!res.ok || length > SEGMENT_MAX_BYTES) {
      segments.delete(url);
      return { res };
    }
    const body = new Uint8Array(await res.arrayBuffer());
    const entry = { body, status: res.status, type: res.headers.get("content-type") || "video/mp2t" };
    const item = segments.get(url);
    if (item) { item.entry = entry; cachedBytes += body.byteLength; }
    evict();
    return { entry };
  })().catch((e) => { segments.delete(url); throw e; });
  segments.set(url, { at: Date.now(), promise });
  return promise;
}

const looksLikeSegment = (url) => /\.(ts|aac|m4s|mp4|m4a|m4v|fmp4|vtt|key)$/i.test(new URL(url).pathname) || !/\.m3u8?$/i.test(new URL(url).pathname);

export async function sign(url, secret) {
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(url));
  return [...new Uint8Array(mac).slice(0, 12)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function proxiedURL(target, secret, ua) {
  return `/x?url=${encodeURIComponent(target)}&s=${await sign(target, secret)}${ua ? `&ua=${encodeURIComponent(ua)}` : ""}`;
}

export function isPlaylist(url, contentType) {
  const ct = (contentType || "").toLowerCase();
  return ct.includes("mpegurl") || /\.m3u8?$/i.test(new URL(url).pathname);
}

/** Réécrit chaque URI d'une playlist HLS pour qu'elle repasse par le relais. */
export async function rewritePlaylist(body, baseURL, secret, prefetch, ua) {
  const lines = body.split(/\r?\n/);
  const out = [];
  const media = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { out.push(line); continue; }
    if (trimmed.startsWith("#")) {
      const matches = [...trimmed.matchAll(/URI="([^"]+)"/g)];
      let rewritten = trimmed;
      for (const m of matches) {
        const abs = new URL(m[1], baseURL).href;
        rewritten = rewritten.replace(m[0], `URI="${await proxiedURL(abs, secret, ua)}"`);
      }
      out.push(rewritten);
    } else {
      const abs = new URL(trimmed, baseURL).href;
      media.push(abs);
      out.push(await proxiedURL(abs, secret, ua));
    }
  }
  // Direct : le lecteur va demander les tout derniers segments ; on les charge déjà.
  // Vidéo à la demande / replay (#EXT-X-ENDLIST) : les premiers.
  if (prefetch && media.length && !/\.m3u8?$/i.test(new URL(media[0]).pathname)) {
    const ended = body.includes("#EXT-X-ENDLIST");
    const pick = ended ? media.slice(0, 3) : media.slice(-3);
    for (const url of pick) prefetch(url);
  }
  return out.join("\n");
}

export async function handleProxy(request, { secret, userAgent: defaultUA }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Méthode non autorisée", { status: 405 });
  }
  const params = new URL(request.url).searchParams;
  const raw = params.get("url");
  // Certains serveurs n'acceptent que des applications connues : la source peut imposer sa signature (User-Agent).
  const askedUA = params.get("ua");
  const ua = askedUA && /^[\x20-\x7e]{1,200}$/.test(askedUA) ? askedUA : null;
  const userAgent = ua || defaultUA;
  let target;
  try {
    target = new URL(raw);
    if (target.protocol !== "http:" && target.protocol !== "https:") throw new Error();
  } catch {
    return new Response("URL invalide", { status: 400 });
  }

  const signed = params.get("s") === (await sign(target.href, secret));
  // Serveur cité dans une playlist M3U lue par le relais (signature par serveur).
  const hostSigned = !!params.get("hs") && params.get("hs") === (await sign(`host:${target.host}`, secret));
  const entry = ENTRY_PATH.test(target.pathname);

  const range = request.headers.get("range");

  // Segment HLS (URL signée, sans plage) : servi depuis le cache / préchargement.
  if (signed && !range && request.method === "GET" && looksLikeSegment(target.href)) {
    try {
      const { entry, res } = await fetchSegment(target.href, userAgent);
      if (entry) {
        return new Response(entry.body, {
          status: entry.status,
          headers: { "content-type": entry.type, "content-length": String(entry.body.byteLength), "cache-control": "no-store" },
        });
      }
      if (res) {
        const out = new Headers({ "cache-control": "no-store" });
        for (const h of PASS_HEADERS) { const v = res.headers.get(h); if (v) out.set(h, v); }
        return new Response(res.body, { status: res.status, headers: out });
      }
    } catch (e) {
      return new Response(`Segment indisponible : ${e.message}`, { status: 502 });
    }
  }

  const headers = new Headers({ "User-Agent": userAgent, "Accept": "*/*" });
  if (range) headers.set("Range", range);

  let upstream;
  try {
    // Délai maximal pour obtenir la réponse (pas pour la lire : un film peut durer 2 h).
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error("délai dépassé")), 20_000);
    try { upstream = await safeFetch(target.href, { method: request.method, headers, signal: ctrl.signal }); }
    finally { clearTimeout(timer); }
  } catch (e) {
    if (e.message === "adresse non autorisée" || e.message === "protocole refusé") return new Response("Adresse non autorisée", { status: 403 });
    return new Response(`Serveur injoignable : ${e.message}`, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!signed && !hostSigned && !entry && !contentType.toLowerCase().startsWith("image/")) {
    upstream.body?.cancel();
    return new Response("Interdit", { status: 403 });
  }

  const finalURL = upstream.url || target.href;
  if (upstream.ok && request.method === "GET" && isPlaylist(finalURL, contentType)) {
    const text = await upstream.text();
    if (text.trimStart().startsWith("#EXTM3U")) {
      const prefetch = (url) => { fetchSegment(url, userAgent).catch(() => {}); };
      return new Response(await rewritePlaylist(text, finalURL, secret, prefetch, ua), {
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
