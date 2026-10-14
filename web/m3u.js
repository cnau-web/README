// Sources « lien M3U » : le serveur lit la playlist (en flux, même très grande) et la renvoie à l'app
// sous forme compacte. Il signe aussi chaque serveur cité dans la playlist : le relais n'accepte
// ces adresses que pour les serveurs réellement présents dans une playlist.
import { safeFetch } from "./security.js";
import { sign } from "./proxy.js";

const MAX_ITEMS = 200_000;
const VOD_EXT = /\.(mp4|mkv|avi|mov|m4v|webm|wmv|flv|mpg|mpeg|3gp)(\?|$)/i;

const attrs = (s) => {
  const out = {};
  for (const m of s.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1].toLowerCase()] = m[2];
  return out;
};

function kindOf(url, name, a) {
  const path = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return ""; } })();
  if (path.includes("/series/") || (VOD_EXT.test(path) && /\bS\d{1,2}\s*E\d{1,3}\b/i.test(name))) return "series";
  if (path.includes("/movie/") || path.includes("/movies/") || VOD_EXT.test(path)) return "movie";
  if (/^(movie|vod|film)/i.test(a["tvg-type"] || a.type || "")) return "movie";
  return "live";
}

export async function handleM3U(request, secret) {
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  const target = new URL(request.url).searchParams.get("url");
  let url;
  try { url = new URL(target); if (!/^https?:$/.test(url.protocol)) throw 0; }
  catch { return new Response(JSON.stringify({ error: "Lien invalide (il doit commencer par http:// ou https://)" }), { status: 400, headers }); }
  let res;
  try {
    res = await safeFetch(url.href, { headers: { "User-Agent": "OndeTV/1.0", "Accept": "*/*" }, signal: AbortSignal.timeout(90_000) });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message === "adresse non autorisée" ? "Adresse non autorisée (réseau local ou réservé)" : `Serveur injoignable : ${e.message}` }), { status: 502, headers });
  }
  if (!res.ok) return new Response(JSON.stringify({ error: `Le serveur de la playlist répond HTTP ${res.status}` }), { status: 502, headers });

  let stream = res.body;
  if (/\.gz(\?|$)/i.test(url.pathname) || (res.headers.get("content-type") || "").includes("gzip")) stream = stream.pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  const items = [];
  const hosts = new Set();
  let epg = null, buf = "", pending = null, group = null, header = false, truncated = false;

  const line = (raw) => {
    const l = raw.trim();
    if (!l) return;
    if (l.startsWith("#EXTM3U")) {
      header = true;
      const a = attrs(l);
      epg = (a["url-tvg"] || a["x-tvg-url"] || a["tvg-url"] || "").split(",")[0].trim() || null;
      return;
    }
    if (l.startsWith("#EXTINF")) {
      const comma = l.lastIndexOf(",");
      const head = comma > 0 ? l.slice(0, comma) : l;
      const a = attrs(head);
      pending = { a, name: (comma > 0 ? l.slice(comma + 1) : "").trim() || a["tvg-name"] || "Sans nom" };
      return;
    }
    if (l.startsWith("#EXTGRP:")) { group = l.slice(8).trim(); return; }
    if (l.startsWith("#")) return;
    if (!pending) return;
    let u;
    try { u = new URL(l, url).href; } catch { pending = null; return; }
    if (!/^https?:/i.test(u)) { pending = null; return; }
    if (items.length >= MAX_ITEMS) { truncated = true; pending = null; return; }
    const { a, name } = pending;
    try { hosts.add(new URL(u).host); } catch { /* ignoré */ }
    items.push([
      kindOf(u, name, a), name, a["tvg-logo"] || a.logo || "", a["group-title"] || group || "Sans groupe", u,
      a["tvg-id"] || "", a.catchup || a["catchup-type"] || "", a["catchup-source"] || "", Number(a["catchup-days"] || a["timeshift"] || 0) || 0,
    ]);
    pending = null; group = null;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) { line(buf.slice(0, nl)); buf = buf.slice(nl + 1); }
      if (!header && buf.length > 4096 && !items.length) break; // ce n'est pas une playlist
    }
    if (buf) line(buf);
  } catch (e) {
    return new Response(JSON.stringify({ error: `Lecture interrompue : ${e.message}` }), { status: 502, headers });
  } finally {
    reader.cancel().catch(() => {});
  }
  if (!header || !items.length) {
    return new Response(JSON.stringify({ error: "Ce lien ne renvoie pas une playlist M3U (vérifiez le lien, ou l'abonnement est peut-être expiré)" }), { status: 422, headers });
  }
  const sigs = {};
  for (const h of hosts) sigs[h] = await sign(`host:${h}`, secret);
  return new Response(JSON.stringify({ epg, hosts: sigs, truncated, items }), { headers });
}
