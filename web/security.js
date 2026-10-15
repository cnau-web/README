// Protections du serveur OndeTV :
//  - le relais ne peut joindre que des adresses publiques d'Internet (jamais le réseau interne du serveur,
//    ni la base de synchronisation, ni les adresses de métadonnées de l'hébergeur), y compris après redirection ;
//  - limitation du nombre de requêtes par adresse IP ;
//  - en-têtes de sécurité (CSP, HSTS, anti-iframe…).

// ---------------------------------------------------------------- adresses autorisées

function ipv4Private(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||            // local, privé, boucle, multicast/réservé
    (a === 100 && b >= 64 && b <= 127) ||                            // CGNAT
    (a === 169 && b === 254) ||                                      // lien local / métadonnées
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
}

function ipv6Private(ip) {
  const s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (s === "::" || s === "::1") return true;
  const v4 = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) return ipv4Private(v4[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(s) || s.startsWith("64:ff9b:") || s.startsWith("2001:db8");
}

const isIPv4 = (h) => /^\d+\.\d+\.\d+\.\d+$/.test(h);
const isIPv6 = (h) => h.includes(":");

// Tests en local uniquement (faux serveur IPTV sur 127.0.0.1). Jamais défini sur Render.
const TEST_ALLOW_PRIVATE = globalThis.Deno?.env.get("ONDETV_TEST_ALLOW_PRIVATE") === "1";
const dnsCache = new Map(); // nom -> { at, ok }

/** Vérifie qu'un nom d'hôte ne désigne que des adresses publiques. */
export async function isPublicHost(hostname) {
  if (TEST_ALLOW_PRIVATE) return true;
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return false;
  if (isIPv4(host)) return !ipv4Private(host);
  if (isIPv6(host)) return !ipv6Private(host);
  if (!host.includes(".")) return false; // noms internes du réseau privé (ex. « ondetv-sync »)
  const hit = dnsCache.get(host);
  if (hit && Date.now() - hit.at < 5 * 60000) return hit.ok;
  let ok = false;
  try {
    const [a, aaaa] = await Promise.all([
      Deno.resolveDns(host, "A").catch(() => []),
      Deno.resolveDns(host, "AAAA").catch(() => []),
    ]);
    // Seules les adresses privées sont bloquées : si le nom ne se résout pas ici, la connexion échouera d'elle-même
    // (évite de refuser à tort un serveur dont le DNS répond mal au relais).
    ok = a.every((ip) => !ipv4Private(ip)) && aaaa.every((ip) => !ipv6Private(ip));
  } catch { ok = false; }
  dnsCache.set(host, { at: Date.now(), ok });
  if (dnsCache.size > 5000) dnsCache.delete(dnsCache.keys().next().value);
  return ok;
}

/** fetch qui refuse les adresses internes et vérifie chaque redirection. */
export async function safeFetch(url, init = {}, maxRedirects = 5) {
  let current = new URL(url);
  for (let i = 0; i <= maxRedirects; i++) {
    if (current.protocol !== "http:" && current.protocol !== "https:") throw new Error("protocole refusé");
    if (!(await isPublicHost(current.hostname))) throw new Error("adresse non autorisée");
    const res = await fetch(current.href, { ...init, redirect: "manual" });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      res.body?.cancel();
      current = new URL(res.headers.get("location"), current);
      continue;
    }
    // L'URL finale sert à résoudre les chemins relatifs des playlists.
    Object.defineProperty(res, "url", { value: current.href });
    return res;
  }
  throw new Error("trop de redirections");
}

// ---------------------------------------------------------------- limitation des requêtes

const buckets = new Map(); // clé -> { start, count }

/** true si la requête est acceptée (limit requêtes par fenêtre de windowMs). */
export function allow(key, limit, windowMs = 60000) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > windowMs) { b = { start: now, count: 0 }; buckets.set(key, b); }
  b.count++;
  if (buckets.size > 20000) {
    for (const [k, v] of buckets) if (now - v.start > windowMs) buckets.delete(k);
  }
  return b.count <= limit;
}

export function clientIP(request, info) {
  // Render place l'adresse du visiteur en premier dans X-Forwarded-For.
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || info?.remoteAddr?.hostname || "inconnu";
}

export const tooMany = () => new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans une minute" }), {
  status: 429, headers: { "content-type": "application/json", "retry-after": "60", "cache-control": "no-store" },
});

// ---------------------------------------------------------------- en-têtes

/** Politique de sécurité de l'application : aucun script externe, pas d'intégration dans une autre page. */
export const APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https:", // relais France facultatif (autre adresse) ; les scripts restent limités à notre site
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
].join("; ");

export const COMMON_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "referrer-policy": "same-origin",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "cross-origin-opener-policy": "same-origin",
};

/** Réponses du relais : jamais interprétées comme une page de notre site (contenu externe). */
export const RELAY_HEADERS = {
  "content-security-policy": "default-src 'none'; sandbox",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export function withHeaders(res, extra) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) if (!h.has(k)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
