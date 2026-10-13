// Stockage de synchronisation entre appareils.
// Les données arrivent DÉJÀ CHIFFRÉES par l'app (AES-GCM, clé dérivée du code de synchronisation) :
// le serveur ne stocke qu'un bloc opaque, identifié par une empreinte du code.
//
// Stockage, par ordre de préférence :
//   1. REDIS_URL (Render Key Value, réseau privé) — client RESP minimal intégré
//   2. UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (Redis en HTTP)
//   3. mémoire du serveur (perdue à chaque redémarrage / mise en veille)

const MAX_BLOB = 2 * 1024 * 1024;
const TTL_SECONDS = 400 * 24 * 3600; // ~13 mois sans utilisation
const memory = new Map();
const env = (k) => globalThis.Deno?.env.get(k);

// ---------------------------------------------------------------- client Redis (RESP) minimal

function encodeCommand(args) {
  const enc = new TextEncoder();
  const parts = [`*${args.length}\r\n`];
  for (const a of args) parts.push(`$${enc.encode(a).length}\r\n${a}\r\n`);
  return enc.encode(parts.join(""));
}

/** Lit une réponse RESP complète (types utilisés : + - : $). */
function parseReply(buf) {
  const text = new TextDecoder().decode(buf);
  const nl = text.indexOf("\r\n");
  if (nl < 0) return undefined;
  const type = text[0];
  const head = text.slice(1, nl);
  if (type === "+" || type === ":") return { value: head };
  if (type === "-") return { error: head };
  if (type === "$") {
    const len = Number(head);
    if (len < 0) return { value: null };
    // longueur en octets : on compare sur le tampon brut
    const headerBytes = new TextEncoder().encode(text.slice(0, nl + 2)).length;
    if (buf.length < headerBytes + len + 2) return undefined;
    return { value: new TextDecoder().decode(buf.slice(headerBytes, headerBytes + len)) };
  }
  return { error: `Réponse Redis inattendue : ${type}` };
}

async function redisCommand(url, args) {
  const u = new URL(url);
  const tls = u.protocol === "rediss:";
  const opts = { hostname: u.hostname, port: Number(u.port || 6379) };
  const conn = tls ? await Deno.connectTls(opts) : await Deno.connect(opts);
  try {
    const send = async (cmd) => {
      await conn.write(encodeCommand(cmd));
      let buf = new Uint8Array(0);
      const chunk = new Uint8Array(64 * 1024);
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        const n = await conn.read(chunk);
        if (n === null) break;
        const merged = new Uint8Array(buf.length + n);
        merged.set(buf); merged.set(chunk.subarray(0, n), buf.length);
        buf = merged;
        const reply = parseReply(buf);
        if (reply) { if (reply.error) throw new Error(reply.error); return reply.value; }
      }
      throw new Error("Redis : réponse incomplète");
    };
    if (u.password) await send(u.username && u.username !== "default" ? ["AUTH", decodeURIComponent(u.username), decodeURIComponent(u.password)] : ["AUTH", decodeURIComponent(u.password)]);
    return await send(args);
  } finally {
    try { conn.close(); } catch { /* déjà fermé */ }
  }
}

// ---------------------------------------------------------------- stockage

function backend() {
  if (env("REDIS_URL")) return "redis";
  if (env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN")) return "upstash";
  return "memory";
}

async function upstash(path, body) {
  const res = await fetch(`${env("UPSTASH_REDIS_REST_URL").replace(/\/$/, "")}/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${env("UPSTASH_REDIS_REST_TOKEN")}` },
    body,
  });
  if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
  return (await res.json()).result;
}

async function getBlob(id) {
  const key = `ondetv:sync:${id}`;
  switch (backend()) {
    case "redis": return await redisCommand(env("REDIS_URL"), ["GET", key]);
    case "upstash": return await upstash(`get/${key}`);
    default: return memory.get(key) ?? null;
  }
}

async function setBlob(id, blob) {
  const key = `ondetv:sync:${id}`;
  switch (backend()) {
    case "redis": await redisCommand(env("REDIS_URL"), ["SET", key, blob, "EX", String(TTL_SECONDS)]); return;
    case "upstash": await upstash(`set/${key}?EX=${TTL_SECONDS}`, blob); return;
    default: memory.set(key, blob);
  }
}

export async function handleSync(request) {
  const { pathname } = new URL(request.url);
  const headers = { "cache-control": "no-store", "content-type": "application/json" };
  if (pathname === "/sync/status") {
    const b = backend();
    return new Response(JSON.stringify({ backend: b, persistent: b !== "memory" }), { headers });
  }
  const id = pathname.slice("/sync/".length);
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response(JSON.stringify({ error: "identifiant invalide" }), { status: 400, headers });
  try {
    if (request.method === "GET") {
      const blob = await getBlob(id);
      return new Response(JSON.stringify({ blob }), { headers });
    }
    if (request.method === "PUT") {
      const blob = await request.text();
      if (blob.length > MAX_BLOB) return new Response(JSON.stringify({ error: "trop volumineux" }), { status: 413, headers });
      if (!/^[A-Za-z0-9+/=]+$/.test(blob)) return new Response(JSON.stringify({ error: "format invalide" }), { status: 400, headers });
      await setBlob(id, blob);
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
    return new Response(JSON.stringify({ error: "méthode non autorisée" }), { status: 405, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 502, headers });
  }
}
