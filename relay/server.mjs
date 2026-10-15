// Relais OndeTV « France » : petit serveur autonome (Node.js 20+, aucune dépendance), à héberger en France
// (ex. alwaysdata, offre gratuite) pour les fournisseurs qui refusent les connexions venant de l'étranger.
// Mêmes règles que le relais principal : adresses internes interdites, seules les URL Xtream (player_api,
// /live/, /movie/, /series/, /timeshift/) et les images passent sans signature ; les segments vidéo sont signés.
import http from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { Readable } from "node:stream";

const PORT = Number(process.env.PORT || 8100);
const HOST = process.env.IP || "0.0.0.0";
const SECRET = process.env.RELAY_SECRET || randomUUID();
const ALLOWED_ORIGINS = (process.env.ALLOW_ORIGIN || "https://ondetv.onrender.com").split(",").map((s) => s.trim());
const DEFAULT_UA = "OndeTV/1.0";
const ENTRY_PATH = /(\/player_api\.php$|^\/(live|movie|series|timeshift)\/|\/streaming\/timeshift\.php$)/i;
const PASS = ["content-type", "content-length", "content-range", "accept-ranges", "last-modified", "etag"];

const sign = (url) => createHmac("sha256", SECRET).update(url).digest("hex").slice(0, 24);

// --- adresses autorisées (jamais le réseau local de l'hébergeur)
function privateV4(ip) {
  const [a, b] = ip.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}
function privateV6(ip) {
  const s = ip.toLowerCase();
  if (s === "::" || s === "::1") return true;
  const m = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (m) return privateV4(m[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s);
}
const dnsCache = new Map();
const TEST_ALLOW_PRIVATE = process.env.RELAY_TEST_ALLOW_PRIVATE === "1"; // tests en local uniquement
async function publicHost(host) {
  if (TEST_ALLOW_PRIVATE) return true;
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!h || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".") && !h.includes(":")) return false;
  const hit = dnsCache.get(h);
  if (hit && Date.now() - hit.at < 300000) return hit.ok;
  let ok = true;
  try {
    const all = await lookup(h, { all: true });
    ok = all.every(({ address, family }) => (family === 6 ? !privateV6(address) : !privateV4(address)));
  } catch { ok = true; } // nom introuvable : la connexion échouera d'elle-même
  dnsCache.set(h, { at: Date.now(), ok });
  if (dnsCache.size > 5000) dnsCache.delete(dnsCache.keys().next().value);
  return ok;
}
async function safeFetch(url, init) {
  let current = new URL(url);
  for (let i = 0; i < 6; i++) {
    if (!/^https?:$/.test(current.protocol)) throw new Error("protocole refusé");
    if (!(await publicHost(current.hostname))) throw new Error("adresse non autorisée");
    const res = await fetch(current, { ...init, redirect: "manual" });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) { res.body?.cancel(); current = new URL(loc, current); continue; }
    return { res, url: current.href };
  }
  throw new Error("trop de redirections");
}

// --- limitation par adresse IP
const buckets = new Map();
function allow(key, limit) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > 60000) { b = { start: now, count: 0 }; buckets.set(key, b); }
  if (buckets.size > 20000) for (const [k, v] of buckets) if (now - v.start > 60000) buckets.delete(k);
  return ++b.count <= limit;
}

function rewrite(text, base, ua) {
  const local = (ref) => {
    const abs = new URL(ref.trim(), base).href;
    return `/x?url=${encodeURIComponent(abs)}&s=${sign(abs)}${ua ? `&ua=${encodeURIComponent(ua)}` : ""}`;
  };
  return text.split(/\r?\n/).map((line) => {
    const t = line.trim();
    if (!t) return line;
    if (t.startsWith("#")) return t.replace(/URI="([^"]+)"/g, (_, u) => `URI="${local(u)}"`);
    return local(t);
  }).join("\n");
}

let location = null;
async function whereAmI() {
  if (!location) location = await fetch("https://ipinfo.io/json", { signal: AbortSignal.timeout(5000) }).then((r) => r.json()).catch(() => ({}));
  return location;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = {
    "access-control-allow-origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "Range",
    "access-control-expose-headers": "Content-Length, Content-Range, Accept-Ranges",
    "vary": "Origin",
  };
  const security = { "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox", "referrer-policy": "no-referrer" };
  const send = (code, body, type = "text/plain; charset=utf-8") => { res.writeHead(code, { ...cors, ...security, "content-type": type, "cache-control": "no-store" }); res.end(body); };
  try {
    if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
    const u = new URL(req.url, "http://relais");
    if (u.pathname === "/health" || u.pathname === "/") {
      const loc = await whereAmI();
      return send(200, JSON.stringify({ ok: true, relay: "OndeTV France", country: loc.country || null, city: loc.city || null }), "application/json");
    }
    if (u.pathname !== "/x") return send(404, "Introuvable");
    if (req.method !== "GET" && req.method !== "HEAD") return send(405, "Méthode non autorisée");
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    const signedParam = u.searchParams.get("s");
    if (!signedParam && !allow(ip, 1500)) return send(429, "Trop de requêtes");
    let target;
    try { target = new URL(u.searchParams.get("url")); if (!/^https?:$/.test(target.protocol)) throw 0; } catch { return send(400, "URL invalide"); }
    const signed = signedParam === sign(target.href);
    const entry = ENTRY_PATH.test(target.pathname);
    const askedUA = u.searchParams.get("ua");
    const ua = askedUA && /^[\x20-\x7e]{1,200}$/.test(askedUA) ? askedUA : null;
    // Sans compression : sinon la taille annoncée ne correspondrait plus au contenu décompressé par Node.
    const headers = { "User-Agent": ua || DEFAULT_UA, "Accept": "*/*", "Accept-Encoding": "identity" };
    if (req.headers.range) headers.Range = req.headers.range;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let up;
    try { up = await safeFetch(target.href, { method: req.method, headers, signal: ctrl.signal }); }
    catch (e) { return send(/non autorisée|protocole/.test(e.message) ? 403 : 502, `Serveur injoignable : ${e.message}`); }
    finally { clearTimeout(timer); }
    const { res: upstream, url: finalURL } = up;
    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    if (!signed && !entry && !ct.startsWith("image/")) { upstream.body?.cancel(); return send(403, "Interdit"); }

    const isPlaylist = ct.includes("mpegurl") || /\.m3u8?$/i.test(new URL(finalURL).pathname);
    if (upstream.ok && req.method === "GET" && isPlaylist) {
      const text = await upstream.text();
      if (text.trimStart().startsWith("#EXTM3U")) return send(200, rewrite(text, finalURL, ua), "application/vnd.apple.mpegurl");
      return send(upstream.status, text, "text/plain; charset=utf-8");
    }
    const out = { ...cors, ...security, "cache-control": ct.startsWith("image/") ? "public, max-age=86400" : "no-store" };
    const encoded = !!upstream.headers.get("content-encoding");
    for (const h of PASS) { const v = upstream.headers.get(h); if (v && !(encoded && h === "content-length")) out[h] = v; }
    if (/html|xml|javascript/.test(ct) && !ct.includes("mpegurl")) out["content-type"] = "text/plain; charset=utf-8";
    res.writeHead(upstream.status, out);
    if (!upstream.body || req.method === "HEAD") return res.end();
    const body = Readable.fromWeb(upstream.body);
    body.on("error", () => res.destroy());
    req.on("close", () => body.destroy());
    body.pipe(res);
  } catch (e) {
    if (!res.headersSent) send(500, `Erreur : ${e.message}`); else res.destroy();
  }
});
server.listen(PORT, HOST, () => console.log(`Relais OndeTV France sur ${HOST}:${PORT}`));
