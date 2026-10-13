// Guides TV publics (XMLTV) en complément du guide du fournisseur IPTV :
// utilisés quand une chaîne n'a pas de programme chez le fournisseur.
//   France  : xmltvfr.fr (402 chaînes : TNT, Canal+, beIN, RMC Sport, DAZN, Eurosport…)
//   Espagne : EPG dobleM (TDT, Movistar+, DAZN, LaLiga…)
// Les fichiers sont lus en flux (gzip) et seuls les programmes d'hier à après-demain sont gardés.

const SOURCES = [
  { id: "fr", url: "https://xmltvfr.fr/xmltv/xmltv_fr.xml.gz" },
  { id: "es", url: "https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv.xml.gz" },
];
const REFRESH_MS = 6 * 3600 * 1000;
const KEEP_PAST_MS = 30 * 3600 * 1000;    // hier (replay)
const KEEP_FUTURE_MS = 36 * 3600 * 1000;  // jusqu'à demain soir

const state = { channels: new Map(), aliases: { fr: new Map(), es: new Map() }, ids: new Map(), loadedAt: 0, loading: null, error: null, stats: {} };

// ---------------------------------------------------------------- normalisation des noms de chaînes

const QUALITY = /\b(uhd|fhd|hd|sd|4k|8k|hevc|h\.?265|h\.?264|1080[pi]?|720p?|2160p?|50 ?fps|60 ?fps|backup|bkp|vip|multi|raw|direct|ott)\b/g;
export function countryHint(name) {
  const m = String(name || "").trim().toLowerCase().match(/^[\[\(|]?\s*(fr|fra|france|es|esp|spain|espana)\s*[\]\)|:\-]/);
  if (!m) return null;
  return m[1].startsWith("f") ? "fr" : "es";
}
export function norm(raw) {
  let s = String(raw || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/\.(tv|fr|es|be|ch|uk|af|ca|lu|mc)$/, "");                       // identifiants XMLTV « TF1.fr »
  s = s.replace(/^\s*(\[[^\]]*\]|\([^)]*\)|\|[^|]*\||[a-z]{2,4}\s*[:|]|[a-z]{2,3}\s+-\s+)\s*/, ""); // « FR: », « |ES| », « [FR] »
  s = s.replace(/\((fr|es|be|ch|lu|mc|fra|esp)\)|\[[^\]]*\]/g, " ");
  s = s.replace(/\(s\)/g, "s");                                                   // « Cinéma(s) »
  s = s.replace(QUALITY, " ");
  s = s.replace(/\s+(fr|fra|france|es|esp|spain)\s*$/, "");                       // « DAZN 1 FR »
  s = s.replace(/\s*plus\s*\+|\+/g, "plus");                                    // « Canal+ » = « Canal Plus », « Plus+ »
  s = s.replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
  return s;
}

// ---------------------------------------------------------------- lecture XMLTV

/** Copie indépendante d'une chaîne : évite que V8 garde le tampon d'origine (plusieurs dizaines de Mo). */
const own = (str) => (str == null ? str : (" " + str).slice(1).split("").join(""));

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENTITIES[e.toLowerCase()] ?? m));
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`)); return m ? decode(m[1]) : null; };
const inner = (block, tag) => { const m = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? decode(m[1]).trim() : null; };

/** « 20261013075000 +0200 » → millisecondes UTC */
export function xmltvTime(v) {
  const m = String(v || "").match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/);
  if (!m) return NaN;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  if (!m[7]) return utc;
  const sign = m[7][0] === "-" ? -1 : 1;
  return utc - sign * (Number(m[7].slice(1, 3)) * 60 + Number(m[7].slice(3, 5))) * 60000;
}

async function loadSource(src, now, channels, aliases, ids) {
  const res = await fetch(src.url, { signal: AbortSignal.timeout(120_000), headers: { "User-Agent": "OndeTV/1.0" } });
  if (!res.ok) throw new Error(`${src.id}: HTTP ${res.status}`);
  const stream = res.body.pipeThrough(new DecompressionStream("gzip")).pipeThrough(new TextDecoderStream());
  let buf = "";
  let programmes = 0;
  const minStop = now - KEEP_PAST_MS, maxStart = now + KEEP_FUTURE_MS;
  for await (const chunk of stream) {
    buf += chunk;
    let pos = 0;
    while (true) {
      const ci = buf.indexOf("<channel ", pos);
      const pi = buf.indexOf("<programme ", pos);
      const start = ci < 0 ? pi : pi < 0 ? ci : Math.min(ci, pi);
      if (start < 0) { pos = Math.max(pos, buf.length - 20); break; }
      const isChannel = start === ci;
      const endTag = isChannel ? "</channel>" : "</programme>";
      const end = buf.indexOf(endTag, start);
      if (end < 0) { pos = start; break; }
      const block = buf.slice(start, end + endTag.length);
      pos = end + endTag.length;
      const head = block.slice(0, block.indexOf(">") + 1);
      if (isChannel) {
        const id = attr(head, "id");
        if (!id) continue;
        const key = own(`${src.id}:${id}`);
        if (!channels.has(key)) channels.set(key, []);
        ids.set(own(id.toLowerCase()), ids.get(id.toLowerCase()) || key);
        const names = [...block.matchAll(/<display-name\b[^>]*>([\s\S]*?)<\/display-name>/g)].map((m) => decode(m[1]).trim());
        for (const n of [id, ...names]) {
          const k = norm(n);
          if (k && !aliases[src.id].has(k)) aliases[src.id].set(own(k), key);
        }
      } else {
        const s = xmltvTime(attr(head, "start")), e = xmltvTime(attr(head, "stop"));
        if (!(e > minStop && s < maxStart)) continue;
        const ch = attr(head, "channel");
        const key = `${src.id}:${ch}`;
        if (!channels.has(key)) channels.set(own(key), []);
        const desc = inner(block, "desc");
        channels.get(key).push({ s, e, t: own(inner(block, "title") || "Sans titre"), d: desc ? own(desc.slice(0, 160)) : undefined });
        programmes++;
      }
    }
    buf = buf.slice(pos);
  }
  return programmes;
}

export function ensureLoaded() {
  if (state.loading) return state.loading;
  if (state.loadedAt && Date.now() - state.loadedAt < REFRESH_MS) return Promise.resolve();
  state.loading = (async () => {
    const now = Date.now();
    const channels = new Map(), aliases = { fr: new Map(), es: new Map() }, ids = new Map(), stats = {};
    const errors = [];
    for (const src of SOURCES) {
      try { stats[src.id] = await loadSource(src, now, channels, aliases, ids); }
      catch (e) { errors.push(e.message); }
    }
    for (const list of channels.values()) list.sort((a, b) => a.s - b.s);
    if (channels.size) Object.assign(state, { channels, aliases, ids, stats, loadedAt: Date.now() });
    state.error = errors.length ? errors.join(" · ") : null;
  })().finally(() => { state.loading = null; });
  return state.loading;
}

/** Trouve la chaîne du guide public correspondant à une chaîne du fournisseur. */
export function match(name, epgId) {
  if (epgId) {
    const exact = state.ids.get(String(epgId).toLowerCase());
    if (exact) return exact;
  }
  const hint = countryHint(name);
  const order = hint === "es" ? ["es", "fr"] : ["fr", "es"];
  for (const candidate of [epgId, name]) {
    const k = norm(candidate);
    if (!k) continue;
    // essai exact, puis sans « s » final (« Cinémas » / « Cinéma »)
    for (const variant of [k, k.replace(/s$/, "")]) {
      for (const c of order) { const key = state.aliases[c].get(variant); if (key) return key; }
    }
  }
  return null;
}

export async function handleEpg(request) {
  const url = new URL(request.url);
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if (url.pathname === "/epg/status") {
    return new Response(JSON.stringify({ loadedAt: state.loadedAt, loading: !!state.loading, channels: state.channels.size, stats: state.stats, error: state.error }), { headers });
  }
  if (url.pathname !== "/epg/lookup" || request.method !== "POST") return new Response("{}", { status: 404, headers });
  // Premier appel après un démarrage : on lance le chargement sans faire attendre l'app.
  const loading = ensureLoaded();
  if (!state.loadedAt) {
    await Promise.race([loading, new Promise((r) => setTimeout(r, 2500))]);
    if (!state.loadedAt) return new Response(JSON.stringify({ loading: true, results: {} }), { headers });
  }
  let body;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400, headers }); }
  const from = Number(body.from) || Date.now() - 3 * 3600 * 1000;
  const to = Number(body.to) || Date.now() + 12 * 3600 * 1000;
  const results = {};
  for (const ch of (body.channels || []).slice(0, 80)) {
    const key = match(ch.name, ch.epgId);
    if (!key) continue;
    const list = (state.channels.get(key) || []).filter((p) => p.e > from && p.s < to);
    if (list.length) results[ch.key] = list;
  }
  return new Response(JSON.stringify({ loading: false, results }), { headers });
}
