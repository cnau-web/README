// OndeTV — version web (Safari iPhone/iPad, ajoutable à l'écran d'accueil).
// Toutes les requêtes vers le serveur Xtream passent par le relais /x du même site.

const $ = (sel, root = document) => root.querySelector(sel);
const app = $("#app");

// ---------------------------------------------------------------- stockage

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée */ }
  },
  del(key) { try { localStorage.removeItem(key); } catch {} },
};

// Plusieurs sources (abonnements Xtream) comme dans TiviMate : leur contenu est fusionné.
// Chaque élément a un identifiant unique « source:id » (id) et son id d'origine (sid).
let sources = store.get("ondetv.sources", null);
let library;
migrateSingleAccount();
library ??= { favChannels: [], favMovies: [], favSeries: [], recents: [], progress: {}, ...store.get("ondetv.library.v2", {}) };

function migrateSingleAccount() {
  if (sources) return;
  sources = [];
  const old = store.get("ondetv.account", null);
  if (old?.password) {
    const src = { id: "s1", name: hostLabel(old.server), server: old.server, username: old.username, password: old.password, timezone: old.timezone, info: old.info, enabled: true };
    sources.push(src);
    // Reprise des favoris / récents / reprises de lecture de l'ancienne version (une seule source).
    const l = store.get(`ondetv.library.${old.server}|${old.username}`, {});
    const k = (id) => `s1:${id}`;
    library = {
      favChannels: (l.favChannels || []).map(k), favMovies: (l.favMovies || []).map(k), favSeries: (l.favSeries || []).map(k),
      recents: (l.recents || []).map(k), progress: {},
    };
    for (const [key, v] of Object.entries(l.progress || {})) library.progress[key.replace(/^(movie|episode)-/, "$1-s1:")] = v;
    store.set("ondetv.library.v2", library);
  }
  store.set("ondetv.sources", sources);
}
function hostLabel(server) { try { return new URL(server).hostname; } catch { return "Source"; } }
function saveSources() {
  store.set("ondetv.sources", sources);
  if (library?.meta) { library.meta.sourcesAt = Date.now(); store.set("ondetv.library.v2", library); }
  if (typeof scheduleSync === "function") scheduleSync(2000);
}
const activeSources = () => sources.filter((x) => x.enabled !== false && x.password);
const sourceOf = (item) => sources.find((x) => x.id === (item.src ?? item));
const multiSource = () => activeSources().length > 1;
const sourceName = (item) => sourceOf(item)?.name || "";
function saveLibrary(delay = 15000) {
  store.set("ondetv.library.v2", library);
  if (typeof scheduleSync === "function") scheduleSync(delay);
}
function toggle(list, id) {
  const i = library[list].indexOf(id);
  if (i >= 0) library[list].splice(i, 1); else library[list].push(id);
  if (library.meta) library.meta.favAt = Date.now();
  saveLibrary(2000);
}

// ---------------------------------------------------------------- API Xtream

const proxy = (url) => `/x?url=${encodeURIComponent(url)}`;

function normalizeServer(raw) {
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  const u = new URL(s);
  const path = u.pathname.replace(/\/(player_api|get|xmltv)\.php$/i, "").replace(/\/+$/, "");
  return `${u.protocol}//${u.host}${path}`;
}

async function api(action, params, acc) {
  params ??= {};
  const u = new URL(`${acc.server}/player_api.php`);
  u.searchParams.set("username", acc.username);
  u.searchParams.set("password", acc.password);
  if (action) u.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(proxy(u.href));
  if (res.status === 502) {
    const detail = await res.text().catch(() => "");
    throw new Error(/dns|resolve|lookup|not known/i.test(detail)
      ? `Adresse introuvable : « ${new URL(acc.server).hostname} » n'existe pas sur Internet. Vérifiez l'orthographe et le port fournis par votre abonnement.`
      : `Serveur injoignable (${new URL(acc.server).host}). Vérifiez l'adresse et le port (souvent :8080).`);
  }
  if (!res.ok) throw new Error(`Erreur serveur (HTTP ${res.status}).`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error("Réponse illisible : vérifiez l'adresse du serveur (http/https, port)."); }
}

const asList = (v) => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : []);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const enc = encodeURIComponent;
const base = (item) => { const a = sourceOf(item); return `${a.server}/%s/${enc(a.username)}/${enc(a.password)}`; };

// Les fonctions prennent l'élément (qui porte sa source « src » et son id d'origine « sid »).
const urls = {
  live: (s) => `${base(s).replace("%s", "live")}/${s.sid}.m3u8`,
  movie: (m, ext) => `${base(m).replace("%s", "movie")}/${m.sid}.${ext || m.ext || "mp4"}`,
  episode: (e) => `${base(e).replace("%s", "series")}/${e.sid}.${e.ext || "mp4"}`,
  catchup: (stream, program) => urls.timeshift(stream, program.start, Math.max(1, Math.ceil((program.end - program.start) / 60000))),
  timeshift(stream, startDate, minutes) {
    const acc = sourceOf(stream);
    const tz = acc.timezone || undefined;
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(startDate).map((p) => [p.type, p.value]));
    const start = `${parts.year}-${parts.month}-${parts.day}:${parts.hour}-${parts.minute}`;
    return `${base(stream).replace("%s", "timeshift")}/${minutes}/${start}/${stream.sid}.m3u8`;
  },
};

function image(url) {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  return url.startsWith("https://") ? url : proxy(url);
}

function b64(s) {
  if (!s) return "";
  try {
    const bytes = Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch { return s; }
}

/** « 2026-10-13 20:00:00 » exprimé dans le fuseau tz → millisecondes UTC */
function zonedToMs(str, tz) {
  const m = String(str || "").match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return NaN;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  if (!tz) return guess;
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
    const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return guess - (asUTC - guess);
  } catch { return guess; }
}

function parseEPG(data, tz) {
  return asList(data?.epg_listings).map((p) => {
    const start = num(p.start_timestamp) ? num(p.start_timestamp) * 1000 : zonedToMs(p.start, tz);
    const stop = num(p.stop_timestamp ?? p.end_timestamp) ? num(p.stop_timestamp ?? p.end_timestamp) * 1000 : zonedToMs(p.end ?? p.stop, tz);
    return {
      id: String(p.id ?? start),
      title: b64(p.title) || "Sans titre",
      description: b64(p.description),
      start: new Date(start),
      end: new Date(stop),
      archive: Number(p.has_archive) === 1,
    };
  }).filter((p) => !isNaN(p.start) && !isNaN(p.end) && p.end > p.start).sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------- cache contenu

const content = {
  liveCats: null, live: null, liveById: new Map(),
  vodCats: null, vod: new Map(), seriesCats: null, series: new Map(),
  epg: new Map(), epgPending: new Set(),
};

let liveLoading = null;
async function loadLive(force = false) {
  if (content.live && !force) return;
  if (liveLoading && !force) return liveLoading;
  liveLoading = (async () => {
    const results = await Promise.allSettled(activeSources().map(async (src) => {
      const [cats, streams] = await Promise.all([api("get_live_categories", {}, src), api("get_live_streams", {}, src)]);
      return {
        cats: asList(cats).map((c) => ({ id: `${src.id}:${c.category_id}`, src: src.id, name: c.category_name || "Sans nom" })),
        live: asList(streams).filter((x) => num(x.stream_id) !== null).map((x) => ({
          id: `${src.id}:${x.stream_id}`, sid: num(x.stream_id), src: src.id, num: num(x.num),
          name: String(x.name ?? "").trim() || `Chaîne ${x.stream_id}`, icon: x.stream_icon, cat: `${src.id}:${x.category_id ?? ""}`, epg: x.epg_channel_id || null,
          archive: Number(x.tv_archive) === 1 && num(x.tv_archive_duration) > 0, archiveDays: num(x.tv_archive_duration) || 0,
        })).sort((a, b) => (a.num ?? 1e9) - (b.num ?? 1e9) || a.name.localeCompare(b.name)),
      };
    }));
    content.liveErrors = results.map((r, i) => r.status === "rejected" ? `${activeSources()[i].name} : ${r.reason.message}` : null).filter(Boolean);
    const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    if (!ok.length && content.liveErrors.length) throw new Error(content.liveErrors.join("\n"));
    content.liveCats = ok.flatMap((r) => r.cats);
    content.live = ok.flatMap((r) => r.live);
    content.liveById = new Map(content.live.map((x) => [x.id, x]));
  })();
  try { await liveLoading; } finally { liveLoading = null; }
}

// EPG court, chargé à la demande (4 requêtes en parallèle au maximum).
const epgQueue = [];
let epgRunning = 0;
function requestEPG(id) {
  if (content.epg.has(id) || content.epgPending.has(id)) return;
  content.epgPending.add(id);
  epgQueue.push(id);
  pumpEPG();
}
function pumpEPG() {
  while (epgRunning < 4 && epgQueue.length) {
    const id = epgQueue.shift();
    epgRunning++;
    const stream = content.liveById.get(id);
    if (!stream) { epgRunning--; content.epgPending.delete(id); continue; }
    api("get_short_epg", { stream_id: stream.sid, limit: 6 }, sourceOf(stream))
      .then((d) => {
        const list = parseEPG(d, sourceOf(stream)?.timezone);
        content.epg.set(id, list);
        document.dispatchEvent(new CustomEvent("epg", { detail: id }));
        // Rien d'exploitable chez le fournisseur → guide public (France / Espagne).
        if (!list.some((p) => p.end > Date.now())) requestPublicEPG(id);
      })
      .catch(() => { content.epg.set(id, []); requestPublicEPG(id); })
      .finally(() => { epgRunning--; content.epgPending.delete(id); pumpEPG(); });
  }
}
// Guides publics (xmltvfr.fr, EPG dobleM) servis par le relais : utilisés quand le fournisseur n'a rien.
const publicQueue = new Set();
let publicTimer = null;
let publicWaits = 0;
const publicProgram = (p) => ({ id: `pub-${p.s}`, title: p.t, description: p.d || "", start: new Date(p.s), end: new Date(p.e), archive: false, public: true });

function requestPublicEPG(id) {
  if (!prefs.publicEpg) return;
  publicQueue.add(id);
  clearTimeout(publicTimer);
  publicTimer = setTimeout(flushPublicEPG, 300);
}

async function flushPublicEPG() {
  const ids = [...publicQueue].slice(0, 60);
  ids.forEach((i) => publicQueue.delete(i));
  if (!ids.length) return;
  const channels = ids.map((id) => { const s = content.liveById.get(id); return s && { key: id, name: s.name, epgId: s.epg }; }).filter(Boolean);
  try {
    const res = await fetch("/epg/lookup", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ channels, from: Date.now() - 3 * 3600e3, to: Date.now() + 12 * 3600e3 }) });
    const body = await res.json();
    if (body.loading) {
      // Le relais charge encore les guides (≈ 10 s après son réveil) : on réessaie.
      if (publicWaits++ < 8) { ids.forEach((i) => publicQueue.add(i)); publicTimer = setTimeout(flushPublicEPG, 5000); }
      return;
    }
    for (const [id, list] of Object.entries(body.results || {})) {
      content.epg.set(id, list.map(publicProgram));
      document.dispatchEvent(new CustomEvent("epg", { detail: id }));
    }
  } catch { /* relais injoignable : tant pis */ }
  if (publicQueue.size) publicTimer = setTimeout(flushPublicEPG, 100);
}

async function publicFullEPG(stream) {
  if (!prefs.publicEpg) return [];
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch("/epg/lookup", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ channels: [{ key: stream.id, name: stream.name, epgId: stream.epg }], from: Date.now() - 30 * 3600e3, to: Date.now() + 36 * 3600e3 }) });
      const body = await res.json();
      if (body.loading) { await new Promise((r) => setTimeout(r, 4000)); continue; }
      return (body.results?.[stream.id] || []).map(publicProgram);
    } catch { return []; }
  }
  return [];
}

const nowProgram = (id, t = new Date()) => content.epg.get(id)?.find((p) => p.start <= t && t < p.end);
const nextProgram = (id, t = new Date()) => content.epg.get(id)?.find((p) => p.start > t);
const progress = (p, t = new Date()) => Math.min(100, Math.max(0, ((t - p.start) / (p.end - p.start)) * 100));

// ---------------------------------------------------------------- groupes masqués (synchronisés)

library.hidden ??= { live: [], vod: [], series: [] };
const hiddenSet = (kind) => new Set(library.hidden?.[kind] || []);
const isHiddenCat = (kind, catId) => (library.hidden?.[kind] || []).includes(catId);
function setHidden(kind, ids, hide) {
  const set = hiddenSet(kind);
  for (const id of ids) { if (hide) set.add(id); else set.delete(id); }
  library.hidden[kind] = [...set];
  if (library.meta) library.meta.groupsAt = Date.now();
  saveLibrary(2000);
}

// ---------------------------------------------------------------- utilitaires UI

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(c));
  return el;
}
const hm = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const durationText = (s) => { const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60); return hh ? `${hh} h ${mm ? mm + " min" : ""}` : `${mm} min`; };
const initials = (name) => name.split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();

function logoBox(stream) {
  const label = h("span", {}, initials(stream.name));
  const box = h("div", { class: "logo-box" }, label);
  const src = image(stream.icon);
  if (src) {
    // Pas de loading="lazy" : une image masquée ne serait jamais chargée. Les listes sont déjà rendues par paquets.
    const img = h("img", { src, alt: "", class: "hidden", decoding: "async" });
    img.onload = () => { label.remove(); img.classList.remove("hidden"); };
    img.onerror = () => img.remove();
    box.append(img);
  }
  return box;
}

/** Affiche une longue liste par paquets, au fil du défilement. */
function renderChunked(container, items, renderItem, scroller, size = 120) {
  let index = 0;
  const sentinel = h("div", { style: { height: "1px" } });
  const more = () => {
    const slice = items.slice(index, index + size);
    index += slice.length;
    sentinel.before(...slice.map(renderItem));
    if (index >= items.length) observer.disconnect();
  };
  const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more(), { root: scroller, rootMargin: "600px" });
  container.append(sentinel);
  more();
  observer.observe(sentinel);
  return () => observer.disconnect();
}

function openSheet(build) {
  const sheet = $("#sheet");
  const target = $("#sheet-content");
  target.replaceChildren(h("div", { class: "loading" }, "Chargement…"));
  sheet.classList.remove("hidden");
  sheet.setAttribute("aria-hidden", "false");
  Promise.resolve(build(target)).catch((e) => target.replaceChildren(h("div", { class: "empty" }, e.message)));
}
function closeSheet() {
  $("#sheet").classList.add("hidden");
  $("#sheet").setAttribute("aria-hidden", "true");
}
$("#sheet").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });

// ---------------------------------------------------------------- connexion

function renderLogin(error = "") {
  const form = sourceForm({ onDone: () => renderShell(), error });
  form.prepend(h("div", { class: "logo" }, h("img", { src: "icon-192.png", alt: "" }), h("h1", {}, "OndeTV"),
    h("div", { class: "muted" }, "Connectez votre abonnement Xtream Codes")));
  form.append(h("p", { class: "muted", style: { fontSize: "13px", textAlign: "center" } },
    "Astuce : Partager → « Sur l'écran d'accueil » pour l'utiliser comme une app. D'autres sources pourront être ajoutées dans Réglages."));
  const codeInput = h("input", { class: "field", placeholder: "Code (ex. ABCD-EFGH-JKLM-NPQR)", autocapitalize: "characters", autocorrect: "off" });
  const codeErr = h("div", { class: "error" });
  const codeBtn = h("button", { class: "btn", type: "button", onclick: async () => {
    codeErr.textContent = ""; codeBtn.disabled = true; codeBtn.textContent = "Récupération…";
    try { await joinSync(codeInput.value); renderShell(); }
    catch (e) { codeErr.textContent = e.message; }
    finally { codeBtn.disabled = false; codeBtn.textContent = "Récupérer mes sources"; }
  } }, "Récupérer mes sources");
  const syncBox = h("div", { class: "sync-login" },
    h("div", { class: "sync-or" }, "ou"),
    h("strong", {}, "Déjà configuré sur un autre appareil ?"),
    h("p", { class: "muted", style: { margin: "4px 0 8px", fontSize: "13px" } }, "Entrez le code de synchronisation affiché dans Réglages sur l'autre appareil."),
    codeInput, codeErr, codeBtn);
  app.replaceChildren(h("div", { class: "login" }, h("div", { class: "login-col" }, form, syncBox)));
}

/** Formulaire d'ajout (ou de modification) d'une source Xtream. */
function sourceForm({ onDone, error = "", existing = null }) {
  const name = h("input", { class: "field", placeholder: "Nom de la source (facultatif)", value: existing?.name || "" });
  const server = h("input", { class: "field", placeholder: "http://serveur.com:8080", inputmode: "url", autocapitalize: "off", autocorrect: "off", value: existing?.server || "" });
  const user = h("input", { class: "field", placeholder: "Nom d'utilisateur", autocapitalize: "off", autocorrect: "off", value: existing?.username || "" });
  const pass = h("input", { class: "field", placeholder: "Mot de passe", type: "password", autocomplete: "current-password" });
  const err = h("div", { class: "error" }, error);
  const submitLabel = existing ? "Enregistrer" : sources.length ? "Ajouter la source" : "Se connecter";
  const submit = h("button", { class: "btn primary", type: "submit" }, submitLabel);

  const form = h("form", {
    async onsubmit(e) {
      e.preventDefault();
      err.textContent = "";
      submit.disabled = true;
      submit.textContent = "Connexion…";
      try {
        const acc = { server: normalizeServer(server.value), username: user.value.trim(), password: pass.value.trim() || existing?.password || "" };
        if (!acc.username || !acc.password) throw new Error("Nom d'utilisateur et mot de passe requis.");
        const auth = await api(null, {}, acc);
        const info = auth?.user_info;
        if (!info || Number(info.auth) !== 1) throw new Error(info?.message || "Identifiants refusés par le serveur.");
        if (info.status && info.status.toLowerCase() !== "active") throw new Error(`Abonnement non actif (statut : ${info.status}).`);
        acc.timezone = auth.server_info?.timezone || null;
        acc.info = info;
        acc.name = name.value.trim() || existing?.name || hostLabel(acc.server);
        acc.enabled = existing?.enabled ?? true;
        if (existing) Object.assign(existing, acc);
        else {
          if (sources.some((x) => x.server === acc.server && x.username === acc.username)) throw new Error("Cette source est déjà ajoutée.");
          acc.id = `s${Date.now().toString(36)}`;
          sources.push(acc);
        }
        saveSources();
        resetContent();
        onDone();
      } catch (e2) {
        err.textContent = e2.message;
      } finally {
        submit.disabled = false;
        submit.textContent = submitLabel;
      }
    },
  }, name, server, user, pass, err, submit);
  if (existing) pass.placeholder = "Mot de passe (inchangé si vide)";
  return form;
}

function resetContent() {
  content.live = null; content.liveCats = null; content.liveById = new Map();
  content.vod.clear(); content.series.clear(); content.vodCats = content.seriesCats = null;
  content.epg.clear(); content.epgPending.clear();
}

// ---------------------------------------------------------------- structure à onglets

const TABS = [
  { id: "live", label: "Direct", icon: "📺", render: renderLive },
  { id: "movies", label: "Films", icon: "🎬", render: renderMovies },
  { id: "series", label: "Séries", icon: "🎞️", render: renderSeries },
  { id: "search", label: "Recherche", icon: "🔍", render: renderSearch },
  { id: "settings", label: "Réglages", icon: "⚙️", render: renderSettings },
];
let currentTab = store.get("ondetv.tab", "live");
let cleanup = null;

function renderShell() {
  const top = h("div", { class: "topbar" });
  const main = h("div", { class: "content" });
  const bar = h("nav", { class: "tabbar" }, TABS.map((t) =>
    h("button", { class: t.id === currentTab ? "active" : "", onclick: () => { currentTab = t.id; store.set("ondetv.tab", t.id); renderShell(); } },
      h("span", {}, t.icon), t.label)));
  app.replaceChildren(h("div", { class: "shell" }, top, main, bar));
  cleanup?.();
  cleanup = null;
  const tab = TABS.find((t) => t.id === currentTab) || TABS[0];
  tab.render(top, main);
}

function failure(main, e, retry) {
  main.replaceChildren(h("div", { class: "empty" }, h("p", {}, e.message), h("button", { class: "btn primary", onclick: retry }, "Réessayer")));
}

// ---------------------------------------------------------------- Direct

let liveCategory = store.get("ondetv.liveCat", "__all");
const replayOpen = new Set();

/** Nom de la catégorie (groupe) d'une chaîne, avec sa source s'il y en a plusieurs. */
function categoryLabel(stream) {
  const cat = content.liveCats?.find((c) => c.id === stream.cat);
  const name = cat?.name || "Sans catégorie";
  return multiSource() ? `${name} · ${sourceName(stream)}` : name;
}
const mixedGroup = (id) => ["__replay", "__fav", "__recent", "__all"].includes(id);

function channelsFor(cat) {
  if (cat === "__fav") return library.favChannels.map((id) => content.liveById.get(id)).filter(Boolean);
  if (cat === "__recent") return library.recents.map((id) => content.liveById.get(id)).filter(Boolean);
  const hidden = hiddenSet("live");
  if (cat === "__all") return hidden.size ? content.live.filter((x) => !hidden.has(x.cat)) : content.live;
  if (cat === "__replay") return content.live.filter((x) => x.archive && !hidden.has(x.cat));
  return content.live.filter((s) => s.cat === cat);
}

async function renderLive(top, main) {
  top.append(h("h2", {}, "Direct"));
  main.replaceChildren(h("div", { class: "loading" }, "Chargement des chaînes…"));
  try { await loadLive(); } catch (e) { return failure(main, e, () => renderShell()); }
  if (content.liveErrors?.length) toastPage(`Source indisponible : ${content.liveErrors.join(" · ")}`);

  const select = h("select", { onchange: () => { liveCategory = select.value; store.set("ondetv.liveCat", liveCategory); draw(); } },
    h("option", { value: "__fav" }, `★ Favoris (${library.favChannels.length})`),
    h("option", { value: "__recent" }, "Récents"),
    h("option", { value: "__replay" }, `⟲ Chaînes avec replay (${channelsFor("__replay").length})`),
    h("option", { value: "__all" }, `Toutes les chaînes (${channelsFor("__all").length})`),
    categoryOptions(content.liveCats));
  select.value = liveCategory;
  if (select.value !== liveCategory) { liveCategory = "__all"; select.value = "__all"; }
  const search = h("input", { type: "search", placeholder: "Rechercher", oninput: () => draw() });
  top.append(h("div", { class: "row" }, select, search));

  const rows = new Map();
  const onEPG = (e) => { const r = rows.get(e.detail); if (r) updateNow(r, e.detail); };
  document.addEventListener("epg", onEPG);
  let stopChunks = null;
  cleanup = () => { document.removeEventListener("epg", onEPG); stopChunks?.(); io.disconnect(); };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { requestEPG(e.target.dataset.id); io.unobserve(e.target); }
  }, { root: main, rootMargin: "200px" });

  function updateNow(row, id) {
    const p = nowProgram(id);
    const now = row.querySelector(".now");
    const bar = row.querySelector(".bar i");
    now.textContent = p ? p.title : "";
    row.querySelector(".bar").classList.toggle("hidden", !p);
    if (p) bar.style.width = progress(p) + "%";
  }

  function draw() {
    stopChunks?.();
    rows.clear();
    const q = search.value.trim().toLowerCase();
    // La recherche porte sur toutes les chaînes de toutes les sources.
    let list = q ? channelsFor("__all").filter((s) => s.name.toLowerCase().includes(q) || String(s.num) === q) : channelsFor(liveCategory);
    main.replaceChildren();
    main.scrollTop = 0;
    if (!list.length) {
      main.append(h("div", { class: "empty" }, q ? "Aucun résultat." : liveCategory === "__fav" ? "Aucun favori. Ouvrez une chaîne (ⓘ) pour l'ajouter." : "Aucune chaîne."));
      return;
    }
    const recents = library.recents.map((id) => content.liveById.get(id)).filter(Boolean).slice(0, 12);
    if (!q && liveCategory !== "__recent" && recents.length) {
      main.append(h("div", { class: "section-label" }, "Derniers visionnages"),
        h("div", { class: "recent-strip" }, recents.map((s) => h("button", { class: "recent-card", onclick: () => playLive(s, recents, "__recent") }, logoBox(s), h("span", {}, s.name)))),
        h("div", { class: "section-label" }, groupTitle(liveCategory)));
    }
    // « Chaînes avec replay » : dépliable par source puis par groupe.
    const playable = list.filter((x) => !x.header);
    if (liveCategory === "__replay" && !q) {
      const multi = multiSource();
      const rows = [];
      for (const src of activeSources()) {
        const ofSrc = list.filter((x) => x.src === src.id);
        if (!ofSrc.length) continue;
        let level = 1;
        if (multi) {
          const key = `src|${src.id}`;
          rows.push({ header: true, key, label: `📡 ${src.name}`, count: ofSrc.length, level: 1, source: true });
          if (!replayOpen.has(key)) continue;
          level = 2;
        }
        for (const c of (content.liveCats || []).filter((c) => c.src === src.id)) {
          const chs = ofSrc.filter((x) => x.cat === c.id);
          if (!chs.length) continue;
          rows.push({ header: true, key: c.id, label: c.name, count: chs.length, level });
          if (replayOpen.has(c.id)) rows.push(...chs);
        }
      }
      list = rows;
    }
    stopChunks = renderChunked(main, list, (s) => {
      if (s.header) {
        const open = replayOpen.has(s.key);
        return h("button", { class: `list-toggle lvl${s.level}${open ? " open" : ""}${s.source ? " source" : ""}`, onclick: () => {
          if (open) replayOpen.delete(s.key); else replayOpen.add(s.key);
          const y = main.scrollTop; draw(); main.scrollTop = y;
        } }, h("span", { class: "chev" }, "›"), s.label, h("span", { class: "count" }, s.count));
      }
      const row = h("div", { class: "channel", "data-id": s.id },
        h("span", { class: "num" }, s.num ?? ""),
        logoBox(s),
        h("button", { class: "info", style: { textAlign: "left" }, onclick: () => playLive(s, playable, liveCategory) },
          h("div", { class: "name" }, s.name, library.favChannels.includes(s.id) ? h("span", { class: "star" }, " ★") : null, s.archive ? h("span", { class: "muted" }, " ⟲") : null),
          (q || mixedGroup(liveCategory)) && liveCategory !== "__replay" ? h("div", { class: "cat-tag" }, categoryLabel(s)) : (multiSource() && !mixedGroup(liveCategory) ? null : null),
          h("div", { class: "now" }), h("div", { class: "bar hidden" }, h("i"))),
        h("button", { class: "info-btn", "aria-label": "Programme", onclick: () => openChannel(s, playable) }, "ⓘ"));
      rows.set(s.id, row);
      if (content.epg.has(s.id)) updateNow(row, s.id); else io.observe(row);
      return row;
    }, main);
  }
  draw();
}

function openChannel(stream, list) {
  openSheet(async (target) => {
    const fav = () => library.favChannels.includes(stream.id);
    const favBtn = h("button", { class: "btn", onclick: () => { toggle("favChannels", stream.id); favBtn.textContent = fav() ? "★ Favori" : "☆ Favori"; } }, fav() ? "★ Favori" : "☆ Favori");
    const header = h("div", { class: "detail", style: { marginTop: "16px" } },
      h("div", { style: { display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" } }, logoBox(stream),
        h("div", {}, h("h3", {}, stream.name), h("div", { class: "facts", style: { margin: 0 } },
          [stream.num ? `N° ${stream.num}` : null, stream.archive ? `Replay ${stream.archiveDays} j` : null, multiSource() ? sourceName(stream) : null].filter(Boolean).join(" · ")))),
      h("div", { class: "actions" }, h("button", { class: "btn primary", onclick: () => { closeSheet(); playLive(stream, list, liveCategory); } }, "▶ Regarder"), favBtn));
    const epgBox = h("div", { class: "detail", style: { marginTop: 0 } }, h("div", { class: "loading" }, "Programme…"));
    target.replaceChildren(header, epgBox);

    const programs0 = await loadFullEPG(stream);
    let programs = programs0;
    if (fullEPGCache.get(stream.id)?.pastChecked === "loading") {
      const onPast = (e) => {
        if (e.detail.id !== stream.id) return;
        document.removeEventListener("fullepg", onPast);
        if (e.detail.added && !$("#sheet").classList.contains("hidden") && $("#sheet-content").contains(epgBox)) openChannel(stream, list);
      };
      document.addEventListener("fullepg", onPast);
    }
    const now = new Date();
    const horizon = now - (stream.archiveDays * 86400000 + 3600000);
    programs = programs.filter((p) => p.end > horizon);
    if (!programs.length) { epgBox.replaceChildren(h("div", { class: "empty" }, "Aucun programme disponible.")); return; }

    epgBox.replaceChildren();
    if (programs[0]?.public) epgBox.append(h("p", { class: "muted", style: { fontSize: "13px" } }, "Programme issu d'un guide public (xmltvfr.fr / dobleM) : votre fournisseur n'en fournit pas pour cette chaîne."));
    let lastDay = "";
    let liveRow = null;
    for (const p of programs) {
      const day = p.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      if (day !== lastDay) { epgBox.append(h("div", { class: "day" }, day)); lastDay = day; }
      const live = p.start <= now && now < p.end;
      const past = p.end <= now;
      const replay = past && stream.archive && (p.archive || p.start > now - stream.archiveDays * 86400000);
      const row = h("button", {
        class: `program${live ? " live" : ""}${past ? " past" : ""}${replay ? " replay" : ""}`,
        onclick: () => {
          if (live) { closeSheet(); playLive(stream, list, liveCategory); }
          else if (replay) { closeSheet(); playCatchup(stream, p); }
          else row.querySelector(".d")?.classList.toggle("open");
        },
      },
        h("span", { class: "time" }, hm(p.start)),
        h("span", { style: { flex: 1, minWidth: 0 } },
          h("div", {}, p.title, live ? h("span", { class: "tag" }, "EN DIRECT") : replay ? h("span", { class: "tag" }, "▶ REVOIR") : null),
          p.description ? h("div", { class: "d muted", style: { fontSize: "13px" } }, p.description) : null));
      if (live) liveRow = row;
      epgBox.append(row);
    }
    liveRow?.scrollIntoView({ block: "center" });
  });
}

// ---------------------------------------------------------------- Films & séries

let vodCategory = store.get("ondetv.vodCat", "__all");
let seriesCategory = store.get("ondetv.seriesCat", "__all");

/** Catégorie « src:id » d'une source, ou « __all » = toutes les sources fusionnées. */
async function fetchCatalog(cache, cat, action, map, sortKey) {
  if (!cache.has(cat)) {
    const targets = cat === "__all" ? activeSources().map((src) => [src, {}])
      : [[sourceOf(cat.split(":")[0]), { category_id: cat.slice(cat.indexOf(":") + 1) }]];
    const results = await Promise.allSettled(targets.filter(([src]) => src).map(async ([src, params]) =>
      asList(await api(action, params, src)).map((x) => map(x, src)).filter(Boolean)));
    const ok = results.filter((r) => r.status === "fulfilled");
    if (!ok.length && results.length) throw results[0].reason;
    cache.set(cat, ok.flatMap((r) => r.value).sort((a, b) => b[sortKey] - a[sortKey]));
  }
  return cache.get(cat);
}

const fetchVOD = (cat) => fetchCatalog(content.vod, cat, "get_vod_streams", (m, src) => num(m.stream_id) === null ? null : ({
  id: `${src.id}:${m.stream_id}`, sid: num(m.stream_id), src: src.id, cat: `${src.id}:${m.category_id ?? ""}`, name: String(m.name ?? "").trim(), icon: m.stream_icon,
  rating: num(m.rating) || null, ext: m.container_extension || "mp4", added: num(m.added) || 0,
}), "added");

const fetchSeries = (cat) => fetchCatalog(content.series, cat, "get_series", (x, src) => num(x.series_id) === null ? null : ({
  id: `${src.id}:${x.series_id}`, sid: num(x.series_id), src: src.id, cat: `${src.id}:${x.category_id ?? ""}`, name: String(x.name ?? "").trim(), icon: x.cover,
  rating: num(x.rating) || null, plot: x.plot, genre: x.genre, cast: x.cast, year: (x.releaseDate || x.release_date || "").slice(0, 4),
  backdrop: Array.isArray(x.backdrop_path) ? x.backdrop_path[0] : x.backdrop_path, modified: num(x.last_modified) || 0,
}), "modified");

async function fetchCategories(action) {
  const results = await Promise.allSettled(activeSources().map(async (src) =>
    asList(await api(action, {}, src)).map((c) => ({ id: `${src.id}:${c.category_id}`, src: src.id, name: c.category_name || "Sans nom" }))));
  const ok = results.filter((r) => r.status === "fulfilled");
  if (!ok.length && results.length) throw results[0].reason;
  return ok.flatMap((r) => r.value);
}

/** Options de catégories, groupées par source quand il y en a plusieurs. */
function categoryOptions(cats) {
  const hidden = hiddenSet("live");
  cats = cats.filter((c) => !hidden.has(c.id));
  if (!multiSource()) return cats.map((c) => h("option", { value: c.id }, c.name));
  return activeSources().map((src) => h("optgroup", { label: src.name },
    cats.filter((c) => c.src === src.id).map((c) => h("option", { value: c.id }, c.name))));
}

function poster(item, onclick, progressFraction) {
  const img = h("div", { class: "img" });
  const src = image(item.icon);
  if (src) img.style.backgroundImage = `url("${src}")`;
  if (item.rating) img.append(h("span", { class: "rating" }, `★ ${item.rating.toFixed(1)}`));
  if (progressFraction) img.append(h("div", { class: "bar" }, h("i", { style: { width: `${progressFraction * 100}%` } })));
  if (multiSource() && item.src) img.append(h("span", { class: "src-badge" }, sourceName(item)));
  return h("button", { class: "poster", onclick }, img, h("div", { class: "title" }, item.name));
}

async function renderCatalog(top, main, kind) {
  const isMovies = kind === "movies";
  top.append(h("h2", {}, isMovies ? "Films" : "Séries"));
  main.replaceChildren(h("div", { class: "loading" }, "Chargement…"));
  let cats;
  try {
    if (isMovies) content.vodCats ??= await fetchCategories("get_vod_categories");
    else content.seriesCats ??= await fetchCategories("get_series_categories");
    cats = isMovies ? content.vodCats : content.seriesCats;
  } catch (e) { return failure(main, e, () => renderShell()); }

  let selected = isMovies ? vodCategory : seriesCategory;
  if (!["__fav", "__resume", "__all"].includes(selected) && !cats.some((c) => c.id === selected)) selected = "__all";
  const kindKey = isMovies ? "vod" : "series";
  const visibleCats = cats.filter((c) => !isHiddenCat(kindKey, c.id));
  // Liste des catégories sur le côté, comme la liste des chaînes (fixe sur iPad en paysage).
  const specials = [{ id: "__fav", name: "★ Favoris" }, ...(isMovies ? [{ id: "__resume", name: "▶ Reprendre" }] : []), { id: "__all", name: "Tout" }];
  const labelOf = (id) => specials.find((x) => x.id === id)?.name || visibleCats.find((c) => c.id === id)?.name || "Catégories";
  let searchTimer = null;
  const search = h("input", { type: "search", placeholder: isMovies ? "Rechercher un film" : "Rechercher une série", oninput: () => { clearTimeout(searchTimer); searchTimer = setTimeout(draw, 250); } });
  const catBtn = h("button", { class: "cat-btn", onclick: () => toggleSide(true) });
  top.append(h("div", { class: "row" }, catBtn, search));

  const side = h("aside", { class: "cat-side" });
  const backdrop = h("div", { class: "cat-backdrop", onclick: () => toggleSide(false) });
  const area = h("div", { class: "cat-area" });
  main.classList.add("catalog-main");
  main.replaceChildren(h("div", { class: "catalog-layout" }, side, backdrop, area));
  const toggleSide = (open) => { side.classList.toggle("open", open); backdrop.classList.toggle("open", open); if (open) side.querySelector(".cat-row.active")?.scrollIntoView({ block: "center" }); };

  let sideSource = "__all";
  let sideQuery = "";
  const sideSearch = h("input", { class: "side-search", type: "search", placeholder: "Filtrer les catégories", oninput: () => { sideQuery = sideSearch.value.trim().toLowerCase(); drawSide(); } });
  const sideList = h("div", { class: "side-list" });
  const sideSources = multiSource() ? h("div", { class: "chips side-sources" }) : null;
  side.append(
    h("div", { class: "panel-head" }, h("strong", {}, isMovies ? "Catégories de films" : "Catégories de séries"),
      h("button", { class: "icon-btn side-close", onclick: () => toggleSide(false), "aria-label": "Fermer" }, "✕")),
    sideSearch, sideSources, sideList);

  function choose(id) {
    selected = id;
    if (isMovies) { vodCategory = id; store.set("ondetv.vodCat", id); } else { seriesCategory = id; store.set("ondetv.seriesCat", id); }
    search.value = "";
    drawSide();
    toggleSide(false);
    load();
  }
  function catRow(id, name) {
    return h("button", { class: `cat-row${id === selected ? " active" : ""}`, onclick: () => choose(id) }, h("span", {}, name));
  }
  function drawSide() {
    catBtn.textContent = `☰ ${labelOf(selected)}`;
    sideSources?.replaceChildren(...[{ id: "__all", name: "Toutes" }, ...activeSources()].map((src) =>
      h("button", { class: `chip${sideSource === src.id ? " active" : ""}`, onclick: () => { sideSource = src.id; drawSide(); } }, src.name)));
    const rows = [];
    if (!sideQuery) specials.forEach((x) => rows.push(catRow(x.id, x.name)));
    for (const src of activeSources()) {
      if (sideSource !== "__all" && sideSource !== src.id) continue;
      const list = visibleCats.filter((c) => c.src === src.id && (!sideQuery || c.name.toLowerCase().includes(sideQuery)));
      if (!list.length) continue;
      if (multiSource()) rows.push(h("div", { class: "source-label" }, src.name));
      list.forEach((c) => rows.push(catRow(c.id, c.name)));
    }
    if (!rows.length) rows.push(h("div", { class: "empty" }, "Aucune catégorie."));
    sideList.replaceChildren(...rows);
  }
  drawSide();

  let items = [];
  let stopChunks = null;
  cleanup = () => stopChunks?.();

  async function load() {
    area.replaceChildren(h("div", { class: "loading" }, "Chargement…"));
    try {
      const fetcher = isMovies ? fetchVOD : fetchSeries;
      if (selected === "__fav" || selected === "__resume") {
        const all = await fetcher("__all");
        const byId = new Map(all.map((x) => [x.id, x]));
        let ids;
        if (selected === "__fav") ids = isMovies ? library.favMovies : library.favSeries;
        else ids = Object.entries(library.progress).filter(([k, v]) => k.startsWith("movie-") && v.pos / v.dur < 0.95)
          .sort((a, b) => b[1].t - a[1].t).map(([k]) => k.slice(6));
        items = ids.map((id) => byId.get(id)).filter(Boolean);
      } else {
        items = await fetcher(selected);
        if (selected === "__all") { const hidden = hiddenSet(kindKey); if (hidden.size) items = items.filter((x) => !hidden.has(x.cat)); }
      }
      draw();
    } catch (e) { failure(area, e, load); }
  }

  let searchToken = 0;
  async function draw() {
    stopChunks?.();
    const q = search.value.trim().toLowerCase();
    let list = items;
    if (q) {
      // Comme TiviMate : la recherche porte sur tout le catalogue, toutes sources confondues.
      const token = ++searchToken;
      area.replaceChildren(h("div", { class: "loading" }, "Recherche dans toutes les sources…"));
      const all = await (isMovies ? fetchVOD : fetchSeries)("__all").catch(() => items);
      if (token !== searchToken) return;
      const hidden = hiddenSet(kindKey);
      list = all.filter((x) => !hidden.has(x.cat) && x.name.toLowerCase().includes(q));
    }
    area.replaceChildren();
    area.scrollTop = 0;
    if (!list.length) { area.append(h("div", { class: "empty" }, q ? "Aucun résultat." : "Rien à afficher.")); return; }
    if (q) area.append(h("div", { class: "section-label" }, `${list.length} résultat${list.length > 1 ? "s" : ""}${multiSource() ? " · toutes sources" : ""}`));
    const grid = h("div", { class: "grid" });
    area.append(grid);
    stopChunks = renderChunked(grid, list, (x) => isMovies
      ? poster(x, () => openMovie(x), progressFraction(`movie-${x.id}`))
      : poster(x, () => openSeries(x)), area, 90);
  }
  load();
}

function renderMovies(top, main) { return renderCatalog(top, main, "movies"); }
function renderSeries(top, main) { return renderCatalog(top, main, "series"); }

function progressFraction(key) {
  const p = library.progress[key];
  return p && p.dur ? Math.min(1, p.pos / p.dur) : 0;
}

function hero(url) {
  const el = h("div", { class: "hero" });
  const src = image(url);
  if (src) el.style.backgroundImage = `url("${src}")`;
  return el;
}

function openMovie(movie) {
  openSheet(async (target) => {
    const data = await api("get_vod_info", { vod_id: movie.sid }, sourceOf(movie)).catch(() => ({}));
    const info = data && !Array.isArray(data.info) ? data.info || {} : {};
    const ext = data?.movie_data?.container_extension || movie.ext;
    const key = `movie-${movie.id}`;
    const facts = [(info.releasedate || "").slice(0, 4), num(info.duration_secs) ? durationText(num(info.duration_secs)) : null,
      movie.rating ? `★ ${movie.rating.toFixed(1)}` : null, ext.toUpperCase(), multiSource() ? sourceName(movie) : null].filter(Boolean).join(" · ");
    const resume = progressFraction(key) > 0 && progressFraction(key) < 0.95;
    const fav = () => library.favMovies.includes(movie.id);
    const favBtn = h("button", { class: "btn", onclick: () => { toggle("favMovies", movie.id); favBtn.textContent = fav() ? "★" : "☆"; } }, fav() ? "★" : "☆");
    const backdrop = Array.isArray(info.backdrop_path) ? info.backdrop_path[0] : info.backdrop_path;
    target.replaceChildren(
      hero(backdrop || info.movie_image || movie.icon),
      h("div", { class: "detail" },
        h("h3", {}, movie.name), h("div", { class: "facts" }, facts),
        h("div", { class: "actions" },
          h("button", { class: "btn primary", onclick: () => { closeSheet(); playVOD(urls.movie(movie, ext), movie.name, null, key); } }, resume ? "▶ Reprendre" : "▶ Lecture"),
          resume ? h("button", { class: "btn", onclick: () => { library.progress[key] = { pos: 0, dur: library.progress[key]?.dur || 0, t: Date.now() }; saveLibrary(2000); closeSheet(); playVOD(urls.movie(movie, ext), movie.name, null, key); } }, "⟲") : null,
          h("button", { class: "btn vlc", onclick: () => { closeSheet(); openInVLC(urls.movie(movie, ext)); } }, "VLC"),
          favBtn),
        !nativeFormat(ext) ? h("p", { class: "muted", style: { fontSize: "13px" } }, prefs.vlcForSpecial
          ? `Format ${ext.toUpperCase()} : la lecture s'ouvre dans VLC (réglable dans Réglages).`
          : `Format ${ext.toUpperCase()} : peut ne pas être lisible ici. Utilisez le bouton VLC.`) : null,
        info.plot ? h("p", {}, info.plot) : null,
        info.genre ? [h("div", { class: "label" }, "Genre"), h("div", {}, info.genre)] : null,
        info.director ? [h("div", { class: "label" }, "Réalisation"), h("div", {}, info.director)] : null,
        info.cast ? [h("div", { class: "label" }, "Avec"), h("div", {}, info.cast)] : null));
  });
}

function openSeries(series) {
  openSheet(async (target) => {
    const data = await api("get_series_info", { series_id: series.sid }, sourceOf(series));
    const bySeason = new Map();
    const addEp = (e, seasonKey) => {
      const s = num(e.season) ?? num(seasonKey) ?? 0;
      if (!bySeason.has(s)) bySeason.set(s, []);
      bySeason.get(s).push({
        id: `${series.src}:${e.id}`, sid: String(e.id), src: series.src, num: num(e.episode_num) ?? 0, season: s, title: e.title || `Épisode ${e.episode_num}`,
        ext: e.container_extension || "mp4", plot: e.info?.plot, image: e.info?.movie_image, duration: num(e.info?.duration_secs),
      });
    };
    const eps = data?.episodes;
    if (Array.isArray(eps)) eps.forEach((list) => asList(list).forEach((e) => addEp(e)));
    else if (eps) Object.entries(eps).forEach(([k, list]) => asList(list).forEach((e) => addEp(e, k)));
    for (const list of bySeason.values()) list.sort((a, b) => a.num - b.num);
    const seasons = [...bySeason.keys()].sort((a, b) => a - b);
    const info = data?.info && !Array.isArray(data.info) ? data.info : {};

    const fav = () => library.favSeries.includes(series.id);
    const favBtn = h("button", { class: "btn", onclick: () => { toggle("favSeries", series.id); favBtn.textContent = fav() ? "★ Favori" : "☆ Favori"; } }, fav() ? "★ Favori" : "☆ Favori");
    const seasonSelect = h("select", { class: "field", style: { marginBottom: "12px" }, onchange: () => drawEpisodes() },
      seasons.map((s) => h("option", { value: s }, `Saison ${s}`)));
    const list = h("div");

    // Saison du dernier épisode regardé
    const watched = seasons.flatMap((s) => bySeason.get(s)).map((e) => [e, library.progress[`episode-${e.id}`]]).filter(([, p]) => p).sort((a, b) => b[1].t - a[1].t);
    if (watched.length) seasonSelect.value = watched[0][0].season;

    function drawEpisodes() {
      const s = Number(seasonSelect.value);
      list.replaceChildren(...(bySeason.get(s) || []).map((e) => {
        const key = `episode-${e.id}`;
        const thumb = h("div", { class: "thumb" });
        const src = image(e.image || series.icon);
        if (src) thumb.style.backgroundImage = `url("${src}")`;
        const f = progressFraction(key);
        if (f) thumb.append(h("div", { class: "bar" }, h("i", { style: { width: `${f * 100}%` } })));
        return h("button", { class: "episode", onclick: () => { closeSheet(); playVOD(urls.episode(e), e.title, `${series.name} · S${e.season} E${e.num}`, key); } },
          thumb,
          h("div", { style: { minWidth: 0, flex: 1 } },
            h("div", { class: "t" }, `${e.num}. ${e.title}`, f >= 0.95 ? " ✓" : ""),
            h("div", { class: "d" }, [e.duration ? durationText(e.duration) : null, isSpecialFormat(e.ext) ? e.ext.toUpperCase() : null].filter(Boolean).join(" · ")),
            e.plot ? h("div", { class: "d" }, e.plot) : null),
          h("span", { class: "episode-actions" }, h("span", { class: "vlc-mini", role: "button", onclick: (ev) => { ev.stopPropagation(); closeSheet(); openInVLC(urls.episode(e)); } }, "VLC")));
      }));
    }

    target.replaceChildren(
      hero((Array.isArray(info.backdrop_path) ? info.backdrop_path[0] : info.backdrop_path) || series.backdrop || series.icon),
      h("div", { class: "detail" },
        h("h3", {}, series.name),
        h("div", { class: "facts" }, [series.year, `${seasons.length} saison${seasons.length > 1 ? "s" : ""}`, series.rating ? `★ ${series.rating.toFixed(1)}` : null, multiSource() ? sourceName(series) : null].filter(Boolean).join(" · ")),
        h("div", { class: "actions" }, favBtn),
        (info.plot || series.plot) ? h("p", {}, info.plot || series.plot) : null,
        seasons.length ? [seasonSelect, list] : h("div", { class: "empty" }, "Aucun épisode disponible.")));
    if (seasons.length) drawEpisodes();
  });
}

// ---------------------------------------------------------------- Réglages

function renderSettings(top, main) {
  top.append(h("h2", {}, "Réglages"));
  const fmtDate = (v) => num(v) ? new Date(num(v) * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "Illimité";
  main.append(
    h("div", { class: "section-label" }, `Sources (${sources.length})`),
    h("div", { class: "list" },
      sources.map((src) => {
        const info = src.info || {};
        const enabled = src.enabled !== false;
        const row = h("div", { class: "source-row" },
          h("button", { class: `toggle${enabled ? " on" : ""}`, style: { borderBottom: 0 }, onclick: () => {
            if (enabled && activeSources().length === 1) { alert("Gardez au moins une source active."); return; }
            src.enabled = !enabled; saveSources(); resetContent(); renderShell();
          } },
            h("span", {}, h("strong", {}, src.name), h("small", {}, `${src.username} · ${hostLabel(src.server)}`),
              h("small", {}, `${info.status || "—"} · expire : ${fmtDate(info.exp_date)}${num(info.max_connections) ? ` · ${info.active_cons ?? 0}/${info.max_connections} connexions` : ""}`)),
            h("span", { class: "switch" })),
          h("div", { class: "source-actions" },
            h("button", { onclick: () => openSheet((t) => { t.replaceChildren(h("div", { class: "detail", style: { marginTop: "48px" } },
              h("h3", {}, "Modifier la source"), sourceForm({ existing: src, onDone: () => { closeSheet(); renderShell(); } }))); }) }, "Modifier"),
            h("button", { style: { color: "var(--live)" }, onclick: () => {
              if (!confirm(`Supprimer la source « ${src.name} » ?`)) return;
              sources = sources.filter((x) => x !== src); saveSources(); resetContent();
              if (!sources.length) renderLogin(); else renderShell();
            } }, "Supprimer")));
        return row;
      }),
      h("button", { class: "item", style: { width: "100%", color: "var(--accent)" }, onclick: () => openSheet((t) => {
        t.replaceChildren(h("div", { class: "detail", style: { marginTop: "48px" } }, h("h3", {}, "Ajouter une source"),
          h("p", { class: "muted" }, "Ses chaînes, films et séries s'ajoutent à ceux des autres sources."),
          sourceForm({ onDone: () => { closeSheet(); renderShell(); } })));
      }) }, h("span", {}, "＋ Ajouter une source"), h("span", {}, ""))),
    h("div", { class: "list" },
      h("button", { class: "item", style: { width: "100%" }, onclick: async () => {
        resetContent();
        await Promise.allSettled(sources.map(async (src) => { const a = await api(null, {}, src); src.info = a.user_info; }));
        saveSources();
        renderShell();
      } }, h("span", {}, "Actualiser chaînes et catalogue"), h("span", {}, "↻")),
      h("button", { class: "item", style: { width: "100%" }, onclick: runDiagnostic }, h("span", {}, "Tester la connexion"), h("span", {}, "📶"))),
    h("div", { class: "section-label" }, "Groupes"),
    h("div", { class: "list" },
      h("button", { class: "item", style: { width: "100%" }, onclick: () => openGroupManager("live") }, h("span", {}, "Gérer les groupes de chaînes"), h("span", {}, `${(library.hidden?.live || []).length} masqué(s) ›`)),
      h("button", { class: "item", style: { width: "100%" }, onclick: () => openGroupManager("vod") }, h("span", {}, "Gérer les catégories de films"), h("span", {}, `${(library.hidden?.vod || []).length} masquée(s) ›`)),
      h("button", { class: "item", style: { width: "100%" }, onclick: () => openGroupManager("series") }, h("span", {}, "Gérer les catégories de séries"), h("span", {}, `${(library.hidden?.series || []).length} masquée(s) ›`))),
    h("div", { class: "section-label" }, "Synchronisation entre appareils"),
    syncSettings(),
    h("div", { class: "section-label" }, "Lecteur du direct"),
    h("div", { class: "list" }, PREF_LABELS.map(([key, label]) => {
      const row = h("button", { class: `toggle${prefs[key] ? " on" : ""}`, onclick: () => {
        prefs[key] = !prefs[key]; savePrefs(); row.classList.toggle("on", prefs[key]);
      } }, h("span", {}, label), h("span", { class: "switch" }));
      return row;
    })),
    h("p", { class: "note" }, "Pendant le direct : glisser haut/bas = zapper, glisser vers la droite = liste des chaînes, vers la gauche = guide, double toucher = chaîne précédente. Clavier : flèches, chiffres, Entrée."),
    h("p", { class: "note" }, "Version web d'OndeTV. Le direct, le replay et les films MP4 se lisent dans Safari ; les fichiers MKV/AVI ne sont pas pris en charge par le navigateur."),
    h("p", { class: "note" }, "Installer : bouton Partager de Safari → « Sur l'écran d'accueil »."),
    h("p", { class: "note" }, "OndeTV est un lecteur : il ne fournit aucun contenu. Utilisez uniquement des abonnements légaux."));
}

async function runDiagnostic() {
  openSheet(async (target) => {
    const lines = h("div", { class: "list" });
    target.replaceChildren(h("div", { class: "detail", style: { marginTop: "48px" } }, h("h3", {}, "Test de connexion"),
      h("p", { class: "muted" }, "Mesure le trajet iPhone → relais → serveurs IPTV."), lines));
    const row = (label, value) => { const r = h("div", { class: "item" }, h("span", {}, label), h("span", {}, value)); lines.append(r); return r; };
    const t0 = performance.now();
    const diag = await fetch("/diag").then((r) => r.json()).catch(() => null);
    row("Relais (Render)", diag?.location || "inconnu");
    row("iPhone → relais", `${Math.round(performance.now() - t0)} ms`);
    for (const src of activeSources()) {
      const r = row(src.name, "…");
      const t = performance.now();
      try { await api(null, {}, src); r.lastChild.textContent = `${Math.round(performance.now() - t)} ms`; }
      catch (e) { r.lastChild.textContent = e.message; }
    }
    const far = diag?.country && !["FR", "DE", "NL", "BE", "GB", "ES", "IT", "CH", "LU"].includes(diag.country);
    lines.after(h("p", { class: "note", style: { margin: "12px 0" } }, far
      ? "Le relais est loin de vous (hors Europe) : chaque image fait un long trajet, ce qui peut causer des coupures. Recréer le service Render dans la région Frankfurt améliorera la fluidité."
      : "Au-delà de 400 ms vers une source, le serveur IPTV ou le réseau est lent : des coupures peuvent venir de là."));
  });
}

function syncSettings() {
  const box = h("div", { class: "list" });
  const draw = () => {
    box.replaceChildren();
    if (!syncState.code) {
      box.append(
        h("div", { class: "item" }, h("span", {}, "Synchronisation"), h("span", {}, "Désactivée")),
        h("p", { class: "note", style: { margin: "8px 16px" } }, "Retrouvez vos sources, favoris, chaînes récentes et reprises de lecture sur tous vos appareils (iPhone, iPad…). Les données sont chiffrées avec votre code avant d'être envoyées."),
        h("button", { class: "item", style: { width: "100%", color: "var(--accent)" }, onclick: async () => { await enableSync(); draw(); } },
          h("span", {}, "Activer et créer un code"), h("span", {}, "🔄")),
        h("button", { class: "item", style: { width: "100%" }, onclick: () => {
          const code = prompt("Code de synchronisation de l'autre appareil :");
          if (code) joinSync(code).then(() => { renderShell(); toast?.("Synchronisé"); }).catch((e) => alert(e.message));
        } }, h("span", {}, "J'ai déjà un code"), h("span", {}, "⌨")));
    } else {
      const codeText = fmtCode(syncState.code);
      box.append(
        h("div", { class: "item" }, h("span", {}, "État"), h("span", { id: "sync-status" }, syncStatusText())),
        h("div", { class: "item sync-code" }, h("span", {}, "Code"), h("strong", {}, codeText)),
        h("p", { class: "note", style: { margin: "8px 16px" } }, "Sur l'iPad (ou un autre appareil) : ouvrez OndeTV → Réglages → Synchronisation → « J'ai déjà un code », ou tapez ce code dès l'écran de connexion. Gardez-le pour vous : il donne accès à vos sources."),
        h("button", { class: "item", style: { width: "100%" }, onclick: async () => {
          try { await navigator.clipboard.writeText(codeText); toastPage("Code copié"); } catch { prompt("Copiez le code :", codeText); }
        } }, h("span", {}, "Copier le code"), h("span", {}, "📋")),
        h("button", { class: "item", style: { width: "100%" }, onclick: async () => { await syncNow(); draw(); } }, h("span", {}, "Synchroniser maintenant"), h("span", {}, "↻")),
        h("button", { class: "item", style: { width: "100%", color: "var(--live)" }, onclick: () => {
          if (confirm("Désactiver la synchronisation sur cet appareil ? Les données restent sur l'appareil.")) { disableSync(); draw(); }
        } }, h("span", {}, "Désactiver sur cet appareil"), h("span", {}, "")));
      fetch("/sync/status").then((r) => r.json()).then((st) => {
        if (!st.persistent) box.append(h("p", { class: "note", style: { margin: "8px 16px", color: "#ffb36b" } },
          "Stockage du serveur temporaire : les données sont perdues quand le serveur redémarre. Chaque appareil les renvoie à son ouverture, mais pour un stockage durable, ajoutez le stockage Key Value dans Render (voir l'aide)."));
      }).catch(() => {});
    }
  };
  draw();
  const onStatus = () => { const el = $("#sync-status"); if (el) el.textContent = syncStatusText(); };
  document.addEventListener("syncstatus", onStatus);
  return box;
}

/** Gestionnaire de groupes : cocher = afficher, décocher = masquer ; tout afficher / tout masquer. */
function openGroupManager(kind) {
  const titles = { live: "Groupes de chaînes", vod: "Catégories de films", series: "Catégories de séries" };
  openSheet(async (target) => {
    let cats;
    if (kind === "live") { await loadLive(); cats = content.liveCats; }
    else if (kind === "vod") cats = content.vodCats ??= await fetchCategories("get_vod_categories");
    else cats = content.seriesCats ??= await fetchCategories("get_series_categories");
    const counts = new Map();
    if (kind === "live") for (const c of content.live) counts.set(c.cat, (counts.get(c.cat) || 0) + 1);

    let source = "__all";
    let query = "";
    const listBox = h("div", { class: "list group-list" });
    const summary = h("div", { class: "muted", style: { fontSize: "13px" } });
    const search = h("input", { class: "field", type: "search", placeholder: "Rechercher un groupe", oninput: () => { query = search.value.trim().toLowerCase(); draw(); } });
    const visibleCats = () => cats.filter((c) => (source === "__all" || c.src === source) && (!query || c.name.toLowerCase().includes(query)));
    const sourceChips = multiSource() ? h("div", { class: "chips", style: { margin: "4px 0 10px" } }) : null;
    const drawChips = () => sourceChips?.replaceChildren(...[{ id: "__all", name: "Toutes les sources" }, ...activeSources()].map((src) =>
      h("button", { class: `chip${source === src.id ? " active" : ""}`, onclick: () => { source = src.id; drawChips(); draw(); } }, src.name)));

    function draw() {
      const shown = visibleCats();
      const hidden = hiddenSet(kind);
      summary.textContent = `${cats.filter((c) => !hidden.has(c.id)).length} affiché(s) · ${hidden.size} masqué(s) sur ${cats.length}`;
      listBox.replaceChildren(...shown.map((c) => {
        const on = !hidden.has(c.id);
        const row = h("button", { class: `toggle${on ? " on" : ""}`, onclick: () => {
          setHidden(kind, [c.id], on);
          draw();
        } }, h("span", {}, c.name, h("small", {}, [multiSource() && source === "__all" ? sourceName(c) : null, counts.has(c.id) ? `${counts.get(c.id)} chaînes` : null].filter(Boolean).join(" · "))), h("span", { class: "switch" }));
        return row;
      }));
      if (!shown.length) listBox.append(h("div", { class: "empty" }, "Aucun groupe."));
    }

    target.replaceChildren(h("div", { class: "detail", style: { marginTop: "48px" } },
      h("h3", {}, titles[kind]),
      h("p", { class: "muted", style: { fontSize: "13px", margin: "4px 0 10px" } }, "Activé = affiché. Désactivez les groupes qui ne vous intéressent pas : ils disparaissent des listes, de la recherche et du zapping. Réglage synchronisé entre vos appareils."),
      sourceChips, search,
      h("div", { class: "actions", style: { margin: "10px 0" } },
        h("button", { class: "btn", onclick: () => { setHidden(kind, visibleCats().map((c) => c.id), false); draw(); } }, "Tout afficher"),
        h("button", { class: "btn", onclick: () => { setHidden(kind, visibleCats().map((c) => c.id), true); draw(); } }, "Tout masquer")),
      summary, listBox,
      h("button", { class: "btn primary", style: { width: "100%", marginTop: "14px" }, onclick: () => { closeSheet(); renderShell(); } }, "Terminé")));
    drawChips();
    draw();
  });
}

// ---------------------------------------------------------------- recherche globale (toutes sources)

let globalQuery = "";
function renderSearch(top, main) {
  top.append(h("h2", {}, "Recherche"));
  let timer = null;
  let token = 0;
  const input = h("input", { type: "search", placeholder: "Chaînes, films, séries…", value: globalQuery, autofocus: true,
    oninput: () => { globalQuery = input.value; clearTimeout(timer); timer = setTimeout(run, 300); } });
  top.append(h("div", { class: "row" }, input));
  cleanup = () => clearTimeout(timer);

  async function run() {
    const q = globalQuery.trim().toLowerCase();
    const my = ++token;
    if (q.length < 2) {
      main.replaceChildren(h("div", { class: "empty" }, multiSource()
        ? `Tapez au moins 2 lettres. La recherche porte sur vos ${activeSources().length} sources.`
        : "Tapez au moins 2 lettres pour chercher une chaîne, un film ou une série."));
      return;
    }
    main.replaceChildren(h("div", { class: "loading" }, "Recherche…"));
    const [live, vod, series] = await Promise.all([
      loadLive().then(() => content.live).catch(() => []),
      fetchVOD("__all").catch(() => []),
      fetchSeries("__all").catch(() => []),
    ]);
    if (my !== token) return;
    const match = (x) => x.name.toLowerCase().includes(q);
    const ch = live.filter((x) => match(x) || String(x.num) === q);
    const mv = vod.filter(match);
    const se = series.filter(match);
    main.replaceChildren();
    if (!ch.length && !mv.length && !se.length) { main.append(h("div", { class: "empty" }, "Aucun résultat.")); return; }
    if (ch.length) {
      main.append(h("div", { class: "section-label" }, `Chaînes (${ch.length})`));
      ch.slice(0, 60).forEach((s) => main.append(h("button", { class: "channel", onclick: () => playLive(s, ch, "__all") },
        h("span", { class: "num" }, s.num ?? ""), logoBox(s),
        h("div", { class: "info" }, h("div", { class: "name" }, s.name), multiSource() ? h("div", { class: "src-tag" }, sourceName(s)) : null))));
    }
    if (mv.length) {
      main.append(h("div", { class: "section-label" }, `Films (${mv.length})`));
      const grid = h("div", { class: "grid" });
      main.append(grid);
      mv.slice(0, 60).forEach((m) => grid.append(poster(m, () => openMovie(m), progressFraction(`movie-${m.id}`))));
    }
    if (se.length) {
      main.append(h("div", { class: "section-label" }, `Séries (${se.length})`));
      const grid = h("div", { class: "grid" });
      main.append(grid);
      se.slice(0, 60).forEach((x) => grid.append(poster(x, () => openSeries(x))));
    }
  }
  run();
  setTimeout(() => input.focus(), 50);
}

let pageToastTimer = null;
function toastPage(message) {
  let t = $("#page-toast");
  if (!t) { t = h("div", { id: "page-toast", class: "page-toast" }); document.body.append(t); }
  t.textContent = message;
  t.classList.remove("hidden");
  clearTimeout(pageToastTimer);
  pageToastTimer = setTimeout(() => t.classList.add("hidden"), 5000);
}

/** EPG complet d'une chaîne (passé inclus, pour le replay). */
/** Réunit deux listes de programmes (la première est prioritaire en cas de chevauchement). */
function mergePrograms(primary, extra) {
  const all = [...primary.map((p) => ({ p, prio: 0 })), ...extra.map((p) => ({ p, prio: 1 }))]
    .sort((a, b) => a.p.start - b.p.start || a.prio - b.prio);
  const out = [];
  for (const { p, prio } of all) {
    const last = out[out.length - 1];
    if (last && p.start < last.end - 60000) {
      // chevauchement : on garde le programme du fournisseur
      if (prio === 0 && last._prio === 1) { out[out.length - 1] = Object.assign(p, { _prio: 0 }); }
      continue;
    }
    out.push(Object.assign(p, { _prio: prio }));
  }
  return out;
}

async function fullEPG(stream) {
  const acc = sourceOf(stream);
  let programs = parseEPG(await api("get_simple_data_table", { stream_id: stream.sid }, acc).catch(() => null), acc?.timezone);
  if (!programs.length) programs = parseEPG(await api("get_short_epg", { stream_id: stream.sid, limit: 20 }, acc).catch(() => null), acc?.timezone);
  // Pas de programme à venir chez le fournisseur : on COMPLÈTE avec le guide public (on garde les jours passés).
  if (!programs.some((p) => p.end > Date.now())) {
    const pub = await publicFullEPG(stream);
    if (pub.length) programs = mergePrograms(programs, pub);
  }
  return programs;
}

/** Jours précédents absents de l'API : on les cherche dans le guide XMLTV complet du fournisseur (via le relais). */
async function providerPastEPG(stream) {
  const acc = sourceOf(stream);
  if (!acc || !stream.epg) return [];
  try {
    const res = await fetch("/epg/provider", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ server: acc.server, username: acc.username, password: acc.password, epgId: stream.epg,
        from: Date.now() - Math.max(1, stream.archiveDays) * 86400e3 - 3600e3, to: Date.now() + 86400e3 }) });
    const body = await res.json();
    return (body.programmes || []).map((p) => ({ id: `x-${p.s}`, title: p.t, description: p.d || "", start: new Date(p.s), end: new Date(p.e), archive: true }));
  } catch { return []; }
}
const needsPastDays = (stream, programs) => stream.archive && stream.archiveDays >= 1 && !programs.some((p) => p.start < Date.now() - 20 * 3600e3);

// ---------------------------------------------------------------- préférences

const PREF_DEFAULTS = {
  tapOpensList: false,     // toucher la vidéo : ouvre la liste des chaînes (sinon affiche les commandes)
  invertZap: false,        // inverser le sens du zapping (glisser / flèches)
  swipeZap: true,          // zapper en glissant vers le haut / le bas
  swipePiP: true,          // glisser vers le haut depuis le bas de l'écran : image dans l'image
  bannerOnZap: true,       // bandeau d'infos à chaque changement de chaîne
  closeListOnSelect: true, // fermer la liste après avoir choisi une chaîne
  resumeLastChannel: false,// relancer la dernière chaîne à l'ouverture de l'app
  nativeEngine: false,     // lecteur natif de Safari (AirPlay) au lieu du lecteur stable hls.js
  vlcForSpecial: true,     // films / épisodes MKV, AVI… ouverts directement dans VLC
  publicEpg: true,         // compléter le guide avec les guides publics (France, Espagne)
  aspect: "contain",       // format d'image par défaut
};
const prefs = { ...PREF_DEFAULTS, ...store.get("ondetv.prefs", {}) };
const savePrefs = () => store.set("ondetv.prefs", prefs);

const ASPECTS = [
  { id: "contain", label: "Ajusté" },
  { id: "cover", label: "Remplir" },
  { id: "fill", label: "Étiré" },
  { id: "zoom", label: "Zoom" },
];

// ---------------------------------------------------------------- lecteur

const player = {
  el: $("#player"), video: $("#video"), hls: null, mode: null,
  stream: null, previous: null, playlist: [], groupId: "__all",
  progressKey: null, lastVOD: null, idleTimer: null, saveTimer: null, sleepTimer: null, sleepAt: null,
  aspect: prefs.aspect, panelObserver: null,
};
const video = player.video;
const nativeFormat = (ext) => ["mp4", "m4v", "mov", "m3u8"].includes(String(ext).toLowerCase());
const canNativeHLS = () => video.canPlayType("application/vnd.apple.mpegurl") !== "";

let hlsLoader = null;
function loadHlsJs() {
  hlsLoader ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
    s.onload = () => resolve(globalThis.Hls);
    s.onerror = () => reject(new Error("Impossible de charger le lecteur HLS."));
    document.head.append(s);
  });
  return hlsLoader;
}

function status(message, actions = []) {
  const box = $("#player-status");
  // Les messages durables (erreur) remplacent les commandes du centre ; « Chargement… » les laisse visibles.
  player.el.classList.toggle("has-status", !!message && actions.length > 0);
  if (!message) { box.classList.add("hidden"); return; }
  box.replaceChildren(h("div", {}, message), ...actions);
  box.classList.remove("hidden");
}

let toastTimer = null;
function toast(message) {
  const t = $("#toast");
  t.textContent = message;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
}

// Moteur « stable » : hls.js sur MediaSource / ManagedMediaSource (iOS 17.1+), réglé comme TiviMate :
// grosse réserve, démarrage en retrait du direct, jamais de saut forcé vers le direct.
const mseAvailable = () => !!(globalThis.ManagedMediaSource || globalThis.MediaSource);
const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: false,
  liveSyncDurationCount: 4,           // démarre 4 segments derrière le direct (réserve dès le départ)
  liveMaxLatencyDurationCount: Infinity, // ne jamais sauter en avant pour « rattraper » le direct
  maxBufferLength: 45,
  maxMaxBufferLength: 90,
  backBufferLength: 90,               // permet de reculer un peu même sans replay
  maxBufferHole: 0.6,
  nudgeMaxRetry: 6,
  manifestLoadingMaxRetry: 6,
  levelLoadingMaxRetry: 6,
  fragLoadingMaxRetry: 8,
  fragLoadingRetryDelay: 500,
  startFragPrefetch: true,
  preferManagedMediaSource: true,
};

async function startVideo(url, startAt = 0) {
  player.currentUrl = url;
  player.hls?.destroy();
  player.hls = null;
  player.mediaRecoveries = 0;
  status("Chargement…");
  const src = proxy(url);
  const isHLS = /\.m3u8(\?|$)/i.test(url);
  const wantHlsJs = isHLS && (prefs.nativeEngine || player.forceNative ? !canNativeHLS() : mseAvailable());
  let usedHlsJs = false;
  if (wantHlsJs) {
    try {
      const Hls = await loadHlsJs();
      if (Hls.isSupported()) {
        video.removeAttribute("src");
        // ManagedMediaSource (iOS) exige de désactiver AirPlay pour ce mode.
        if (globalThis.ManagedMediaSource) video.disableRemotePlayback = true;
        const hls = new Hls({ ...HLS_CONFIG, startPosition: startAt > 0 ? startAt : -1 });
        player.hls = hls;
        hls.on(Hls.Events.ERROR, (_, d) => {
          if (!d.fatal || player.hls !== hls) return;
          if (d.type === Hls.ErrorTypes.NETWORK_ERROR) {
            status("Connexion instable… reprise");
            setTimeout(() => { if (player.hls === hls) hls.startLoad(); }, 1000);
          } else if (d.type === Hls.ErrorTypes.MEDIA_ERROR && player.mediaRecoveries++ < 3) {
            hls.recoverMediaError();
          } else {
            onVideoError();
          }
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        usedHlsJs = true;
      }
    } catch { /* hls.js indisponible : lecteur natif */ }
  }
  if (!usedHlsJs) {
    video.disableRemotePlayback = false;
    if (isHLS && !canNativeHLS()) { status("Ce navigateur ne peut pas lire ce flux."); return; }
    video.src = src;
  }
  $("#btn-airplay").classList.toggle("hidden", !video.webkitShowPlaybackTargetPicker || video.disableRemotePlayback);
  video.onloadedmetadata = () => {
    if (startAt <= 0 || usedHlsJs) return; // hls.js gère startPosition
    const end = Number.isFinite(video.duration) ? video.duration : (video.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0);
    if (end > startAt) video.currentTime = startAt;
  };
  video.play().catch(() => status("Touchez ▶ pour lancer la lecture.", [h("button", { class: "btn primary", onclick: () => video.play() }, "▶ Lecture")]));
}

video.addEventListener("playing", () => { status(""); updatePauseButton(); });
video.addEventListener("pause", updatePauseButton);
video.addEventListener("waiting", () => status("Chargement…"));
video.addEventListener("error", () => { if (player.mode) onVideoError(); });

function bufferAhead() {
  const b = video.buffered;
  for (let i = 0; i < b.length; i++) if (b.start(i) <= video.currentTime + 0.5 && video.currentTime <= b.end(i)) return b.end(i) - video.currentTime;
  return 0;
}

function onVideoError() {
  const actions = [h("button", { class: "btn primary", onclick: retry }, "Réessayer")];
  if (player.mode === "live") actions.push(h("button", { class: "btn", style: { marginLeft: "8px" }, onclick: () => zap(1) }, "Chaîne suivante"));
  actions.push(h("button", { class: "btn vlc", style: { marginLeft: "8px" }, onclick: () => openInVLC(currentDirectURL()) }, "Ouvrir dans VLC"));
  status(player.mode === "live" ? "Chaîne indisponible pour le moment." : "Lecture impossible ici (format non pris en charge par le navigateur ou flux indisponible). VLC lit tous les formats.", actions);
}
function retry() {
  if (player.mode === "live") { if (player.shift) shiftTo(watchedTime()); else playLive(player.stream); }
  else if (player.lastVOD) playVOD(...player.lastVOD);
}

function openPlayer(mode, title, subtitle) {
  player.mode = mode;
  player.el.classList.toggle("vod", mode === "vod");
  video.controls = false;
  $("#tap-layer").classList.remove("hidden");
  $("#live-ui").classList.toggle("hidden", mode !== "live");
  $("#vod-ui").classList.toggle("hidden", mode !== "vod");
  $("#center-back-label").textContent = mode === "live" ? "30 s" : "10 s";
  $("#center-fwd-label").textContent = "30 s";
  video.playbackRate = 1;
  $("#vod-speed").innerHTML = "<span>⏱</span>×1";
  $("#player-fav").classList.toggle("hidden", mode !== "live");
  $("#btn-airplay").classList.toggle("hidden", !video.webkitShowPlaybackTargetPicker);
  $("#player-title").textContent = title;
  $("#player-subtitle").textContent = subtitle || "";
  if (mode !== "live") $("#player-logo").replaceChildren();
  applyAspect();
  player.minimized = false;
  player.el.classList.remove("hidden");
  player.el.setAttribute("aria-hidden", "false");
  wake();
}

function closePlayer() {
  $("#pip-prompt").classList.add("hidden");
  player.minimized = false;
  player.forceNative = false;
  if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  player.el.classList.remove("rotated", "immersive");
  if (isPiP()) {
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else video.webkitSetPresentationMode?.("inline");
  }
  saveVODProgress();
  clearInterval(player.saveTimer);
  setSleep(0, true);
  player.hls?.destroy();
  player.hls = null;
  video.pause();
  video.removeAttribute("src");
  video.load();
  closePanels();
  player.el.classList.add("hidden");
  player.el.setAttribute("aria-hidden", "true");
  status("");
  player.mode = null;
  if (currentTab === "live") renderShell();
}

// --- interface : apparition / masquage

const anyOverlayOpen = () => !$("#channel-panel").classList.contains("hidden") || !$("#guide-panel").classList.contains("hidden")
  || !$("#numpad").classList.contains("hidden") || !$("#menu").classList.contains("hidden");

function wake(duration = 5000) {
  player.el.classList.remove("idle");
  clearTimeout(player.idleTimer);
  player.idleTimer = setTimeout(() => {
    if (!video.paused && !anyOverlayOpen() && player.mode) player.el.classList.add("idle");
  }, duration);
}
function hideUI() { clearTimeout(player.idleTimer); player.el.classList.add("idle"); }

function updatePauseButton() {
  $("#center-play").innerHTML = video.paused ? "<span>▶</span>" : "<span>⏸</span>";
}

function applyAspect() {
  const a = player.aspect;
  video.style.objectFit = a === "zoom" ? "cover" : a;
  video.style.transform = a === "zoom" ? "scale(1.18)" : "";
  const label = ASPECTS.find((x) => x.id === player.aspect)?.label || "Ajusté";
  document.querySelectorAll(".btn-aspect").forEach((b) => { b.innerHTML = `<span>⤢</span>${label}`; });
}

// --- direct

function groupList(groupId) {
  return channelsFor(groupId) || [];
}

function playLive(stream, list, groupId) {
  if (!stream) return;
  if (player.stream && player.stream.id !== stream.id) player.previous = { stream: player.stream, playlist: player.playlist, groupId: player.groupId };
  player.shift = null;
  player.pausedAt = null;
  player.stream = stream;
  if (groupId) player.groupId = groupId;
  if (list?.length) player.playlist = list;
  else if (!player.playlist.some((s) => s.id === stream.id)) player.playlist = groupList(player.groupId).some((s) => s.id === stream.id) ? groupList(player.groupId) : [stream];
  library.recents = [stream.id, ...library.recents.filter((id) => id !== stream.id)].slice(0, 30);
  if (library.meta) library.meta.recentsAt = Date.now();
  library.lastChannel = { id: stream.id, groupId: player.groupId };
  saveLibrary();

  openPlayer("live", stream.name, [stream.num ? `Chaîne ${stream.num}` : groupTitle(player.groupId), multiSource() ? sourceName(stream) : null].filter(Boolean).join(" · "));
  $("#player-logo").replaceChildren(logoBox(stream));
  $("#player-fav").textContent = library.favChannels.includes(stream.id) ? "★" : "☆";
  $("#banner-num").textContent = stream.num ?? "";
  updateLiveEPG();
  if (!content.epg.has(stream.id)) requestEPG(stream.id);
  markPlayingInPanel();
  updateShiftUI();
  if (prefs.bannerOnZap) wake(4000); else hideUI();
  startVideo(urls.live(stream));
  if (stream.archive) loadFullEPG(stream);
}

function updateLiveEPG() {
  if (player.mode !== "live" || !player.stream) return;
  const t = watchedTime();
  const now = programAt(player.stream, t);
  const next = programAfter(player.stream, t);
  $("#epg-now").textContent = now ? now.title : "Pas d'information de programme";
  $("#epg-start").textContent = now ? hm(now.start) : "";
  $("#epg-end").textContent = now ? hm(now.end) : "";
  $("#epg-progress").style.width = now ? `${progress(now, t)}%` : "0";
  $("#epg-next").textContent = next ? `Ensuite ${hm(next.start)} · ${next.title}` : "";
  const badge = document.querySelector("#live-banner .live-badge");
  badge.textContent = player.shift ? "DIFFÉRÉ" : "DIRECT";
  badge.classList.toggle("shifted", !!player.shift);
}

// ---------------------------------------------------------------- retour en arrière dans le direct (timeshift)
// Utilise l'archive du fournisseur (chaînes « replay ») : /timeshift/…/<durée>/<début>/<id>.m3u8

const fullEPGCache = new Map();
async function loadFullEPG(stream) {
  const cached = fullEPGCache.get(stream.id);
  if (cached && Date.now() - cached.at < 10 * 60000) return cached.programs;
  const programs = await fullEPG(stream).catch(() => []);
  const entry = { at: Date.now(), programs, pastChecked: false };
  fullEPGCache.set(stream.id, entry);
  if (player.stream?.id === stream.id) { updateLiveEPG(); updateShiftUI(); }
  // Replay sans les jours précédents : recherche en arrière-plan dans le guide complet du fournisseur.
  if (needsPastDays(stream, programs)) {
    entry.pastChecked = "loading";
    providerPastEPG(stream).then((past) => {
      entry.pastChecked = true;
      if (!past.length) { document.dispatchEvent(new CustomEvent("fullepg", { detail: { id: stream.id, added: 0 } })); return; }
      entry.programs = mergePrograms(entry.programs, past);
      document.dispatchEvent(new CustomEvent("fullepg", { detail: { id: stream.id, added: past.length } }));
    });
  }
  return programs;
}
const knownPrograms = (stream) => {
  const full = fullEPGCache.get(stream.id)?.programs || [];
  return full.length ? full : (content.epg.get(stream.id) || []);
};
const programAt = (stream, t) => knownPrograms(stream).find((p) => p.start <= t && t < p.end);
const programAfter = (stream, t) => knownPrograms(stream).find((p) => p.start > t);

/** Heure réelle de l'image affichée (maintenant en direct, plus tôt en différé). */
function watchedTime() {
  if (!player.shift) return new Date();
  return new Date(player.shift.start.getTime() + (video.currentTime || 0) * 1000);
}

function loadedEnd() {
  if (Number.isFinite(video.duration)) return video.duration;
  return video.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0;
}

function shiftTo(target) {
  const s = player.stream;
  if (!s) return;
  if (!s.archive) { toast("Retour en arrière impossible : pas de replay sur cette chaîne"); return; }
  const now = Date.now();
  if (target.getTime() >= now - 20000) { goLive(); return; }
  const oldest = now - s.archiveDays * 86400000 + 60000;
  if (target.getTime() < oldest) target = new Date(oldest);

  // Déjà dans le flux différé chargé ? On se déplace sans recharger.
  if (player.shift) {
    const offset = (target - player.shift.start) / 1000;
    if (offset >= 0 && offset < loadedEnd() - 2) {
      video.currentTime = offset;
      updateShiftUI();
      updateLiveEPG();
      return;
    }
  }
  const start = new Date(Math.floor(target.getTime() / 60000) * 60000);
  const prog = programAt(s, target);
  const until = Math.max(prog ? prog.end.getTime() : 0, now + 3 * 3600000);
  const minutes = Math.max(5, Math.ceil((until - start) / 60000));
  player.shift = { start, minutes };
  startVideo(urls.timeshift(s, start, minutes), (target - start) / 1000);
  updateShiftUI();
  updateLiveEPG();
  wake();
}

function goLive() {
  if (!player.stream) return;
  if (!player.stream.archive && localWindow()) {
    video.currentTime = localWindow().end - 1;
    if (video.paused) video.play();
    updateShiftUI();
    toast("Retour au direct");
    return;
  }
  const wasShifted = !!player.shift;
  player.shift = null;
  player.pausedAt = null;
  if (wasShifted) startVideo(urls.live(player.stream));
  else if (video.paused) video.play();
  updateShiftUI();
  updateLiveEPG();
  toast("Retour au direct");
}

function skip(seconds) {
  const s = player.stream;
  if (s && !s.archive) {
    const w = localWindow();
    if (!w) { toast("Retour en arrière impossible : pas de replay sur cette chaîne"); return; }
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, w.start), w.end - 1);
    updateShiftUI();
    return;
  }
  shiftTo(new Date(watchedTime().getTime() + seconds * 1000));
}

function restartProgram() {
  const s = player.stream;
  if (!s?.archive) { toast("Reprise du début impossible : pas de replay sur cette chaîne"); return; }
  const p = programAt(s, watchedTime());
  if (!p) { toast("Programme inconnu : recul de 10 minutes"); skip(-600); return; }
  shiftTo(new Date(p.start.getTime() + 1000));
  toast(`Reprise au début : ${p.title}`);
}

/** Fenêtre de retour arrière du flux en direct lui-même (tampon HLS), sans archive. */
function localWindow() {
  if (!video.seekable.length) return null;
  const start = video.seekable.start(0);
  const end = video.seekable.end(video.seekable.length - 1);
  return end - start > 45 ? { start, end } : null;
}

function updateShiftUI() {
  const shifted = !!player.shift;
  const s = player.stream;
  const bar = $("#shift-bar");
  const range = $("#shift-range");
  const dragging = range.matches(":active") || range.dataset.dragging === "1";
  $("#btn-golive").classList.toggle("hidden", !shifted && !isBehindLocal());
  if (!s || player.mode !== "live") { bar.classList.add("hidden"); return; }

  let winStart, winEnd, pos, avail;
  if (s.archive) {
    // Fenêtre = programme regardé (de son début à sa fin) ; la partie après « maintenant » n'est pas encore diffusée.
    const t = watchedTime();
    const p = programAt(s, t);
    winStart = p ? p.start.getTime() : Date.now() - 2 * 3600000;
    winEnd = p ? p.end.getTime() : Date.now();
    pos = t.getTime();
    avail = Date.now();
    range.dataset.mode = "archive";
    if (!dragging) $("#shift-time").textContent = hm(t);
    const delay = Math.round((Date.now() - t) / 60000);
    $("#shift-delay").textContent = shifted ? (delay >= 1 ? `−${delay} min` : "−<1 min") : "DIRECT";
  } else {
    const w = localWindow();
    if (!w) { bar.classList.add("hidden"); return; }
    winStart = w.start; winEnd = w.end; pos = video.currentTime; avail = w.end;
    range.dataset.mode = "local";
    const behind = Math.max(0, w.end - video.currentTime);
    if (!dragging) $("#shift-time").textContent = hm(new Date(Date.now() - behind * 1000));
    $("#shift-delay").textContent = behind > 8 ? `−${Math.round(behind)} s` : "DIRECT";
  }
  bar.classList.remove("hidden");
  const span = Math.max(1, winEnd - winStart);
  if (!dragging) range.value = Math.round(((pos - winStart) / span) * 1000);
  range.dataset.start = winStart;
  range.dataset.end = winEnd;
  range.style.setProperty("--pos", `${Math.min(100, Math.max(0, ((dragging ? winStart + (range.value / 1000) * span : pos) - winStart) / span * 100))}%`);
  range.style.setProperty("--avail", `${Math.min(100, Math.max(0, (avail - winStart) / span * 100))}%`);
}
setInterval(() => { if (player.mode === "live") { updateShiftUI(); if (player.shift) updateLiveEPG(); } }, 1000);

const isBehindLocal = () => player.stream && !player.stream.archive && !!localWindow() && localWindow().end - video.currentTime > 8;
const rangeValue = (r) => Number(r.dataset.start) + (Number(r.value) / 1000) * (Number(r.dataset.end) - Number(r.dataset.start));

const shiftRange = $("#shift-range");
shiftRange.addEventListener("pointerdown", () => { shiftRange.dataset.dragging = "1"; });
shiftRange.addEventListener("touchstart", () => { shiftRange.dataset.dragging = "1"; }, { passive: true });
shiftRange.addEventListener("input", () => {
  wake();
  const v = rangeValue(shiftRange);
  const span = Number(shiftRange.dataset.end) - Number(shiftRange.dataset.start);
  shiftRange.style.setProperty("--pos", `${((v - Number(shiftRange.dataset.start)) / span) * 100}%`);
  if (shiftRange.dataset.mode === "local") {
    const behind = localWindow() ? localWindow().end - v : 0;
    $("#shift-time").textContent = `${hm(new Date(Date.now() - behind * 1000))} · −${Math.round(behind)} s`;
  } else {
    const t = new Date(Math.min(v, Date.now()));
    const p = player.stream && programAt(player.stream, t);
    $("#shift-time").textContent = `${hm(t)}${p ? ` · ${p.title}` : ""}`;
  }
});
shiftRange.addEventListener("change", () => {
  shiftRange.dataset.dragging = "";
  const v = rangeValue(shiftRange);
  if (shiftRange.dataset.mode === "local") {
    const w = localWindow();
    if (w) video.currentTime = Math.min(Math.max(v, w.start), w.end - 1);
  } else {
    shiftTo(new Date(Math.min(v, Date.now())));
  }
  updateShiftUI();
});

// Pause du direct : à la reprise, on repart de l'instant de la pause (chaînes avec replay).
function togglePause() {
  if (player.mode !== "live") { video.paused ? video.play() : video.pause(); return; }
  if (!video.paused) {
    video.pause();
    if (!player.shift) player.pausedAt = new Date();
    return;
  }
  if (player.pausedAt && player.stream?.archive && Date.now() - player.pausedAt > 15000) {
    const at = player.pausedAt;
    player.pausedAt = null;
    shiftTo(at);
  } else {
    player.pausedAt = null;
    video.play();
  }
}

// ---------------------------------------------------------------- lecture dans VLC (formats spéciaux)
// VLC lit directement le serveur (http) : pas de relais, tous formats (MKV, AVI, HEVC, AC3…).

const NATIVE_EXT = ["mp4", "m4v", "mov", "m3u8"];
const isSpecialFormat = (ext) => !NATIVE_EXT.includes(String(ext || "").toLowerCase());

function launchScheme(href) {
  // Un lien cliqué ouvre une autre app de façon plus fiable qu'une redirection (surtout depuis l'écran d'accueil).
  const a = document.createElement("a");
  a.href = href;
  a.rel = "noopener";
  document.body.append(a);
  a.click();
  a.remove();
}

function openInVLC(url) {
  if (!url) return;
  if (Native) { saveVODProgress(); if (player.mode) video.pause(); playNative(url, $("#player-title").textContent, $("#player-subtitle").textContent, player.mode === "vod" ? player.progressKey : null); return; }
  saveVODProgress();
  if (player.mode) video.pause();
  let left = false;
  const onHide = () => { if (document.hidden) left = true; };
  document.addEventListener("visibilitychange", onHide);
  launchScheme(`vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(url)}`);
  // Deuxième format, reconnu par toutes les versions de VLC.
  setTimeout(() => { if (!left && !document.hidden) launchScheme(`vlc://${url}`); }, 1200);
  setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    if (left || document.hidden) return;
    showVLCHelp(url);
  }, 2800);
}

function showVLCHelp(url) {
  openSheet((target) => {
    target.replaceChildren(h("div", { class: "detail", style: { marginTop: "48px" } },
      h("h3", {}, "Ouvrir dans VLC"),
      h("p", { class: "muted" }, "VLC ne s'est pas ouvert automatiquement. Vérifiez que « VLC for Mobile » est installé (gratuit sur l'App Store), puis :"),
      h("div", { class: "actions" },
        h("button", { class: "btn vlc", onclick: () => launchScheme(`vlc://${url}`) }, "Réessayer"),
        h("button", { class: "btn", onclick: async () => {
          try { await navigator.clipboard.writeText(url); toastPage("Lien copié"); } catch { prompt("Copiez ce lien :", url); }
        } }, "Copier le lien")),
      h("p", { class: "muted", style: { fontSize: "13px" } }, "Avec le lien copié : ouvrez VLC → onglet Réseau → « Flux réseau » → collez le lien → Ouvrir le flux."),
      h("a", { class: "btn", style: { display: "block", marginTop: "10px" }, href: "https://apps.apple.com/app/vlc-media-player/id650377962", target: "_blank", rel: "noopener" }, "Installer VLC (App Store)")));
  });
}

/** Adresse directe (sans relais) de ce qui est en cours de lecture. */
function currentDirectURL() {
  if (player.mode === "live" && player.stream) {
    if (player.shift) return urls.timeshift(player.stream, new Date(watchedTime().getTime() - 0), player.shift.minutes).replace(/\.m3u8$/, ".ts");
    return urls.live(player.stream).replace(/\.m3u8$/, ".ts");
  }
  return player.lastVOD?.[0] || null;
}

// ---------------------------------------------------------------- plein écran (avec les boutons d'OndeTV)

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const isFullscreen = () => !!fsElement() || player.el.classList.contains("rotated") || player.el.classList.contains("immersive");

async function toggleFullscreen() {
  // iPhone / iPad : Apple ne permet le vrai plein écran (barre d'état masquée, PiP, AirPlay)
  // qu'avec son lecteur ; on propose les deux.
  if (isIOS() && !isFullscreen()) {
    openMenu("Plein écran", [
      { label: "Plein écran OndeTV (tous les boutons)", action: () => ondetvFullscreen() },
      { label: "Plein écran iOS (PiP, AirPlay)", action: openNativeFullscreen },
    ]);
    return;
  }
  return ondetvFullscreen();
}

async function ondetvFullscreen() {
  if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen)?.call(document); return; }
  if (player.el.classList.contains("rotated")) { setRotated(false); return; }
  if (player.el.classList.contains("immersive")) { setImmersive(false); return; }
  // iPad / ordinateur : vrai plein écran de tout le lecteur (vidéo + boutons OndeTV).
  const el = player.el;
  const request = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitRequestFullScreen;
  if (request) {
    try {
      const r = request.call(el);
      if (r?.then) await r;
      if (await waitFor(() => !!fsElement(), 1200)) {
        screen.orientation?.lock?.("landscape").catch(() => {});
        return;
      }
    } catch { /* refusé (app sur l'écran d'accueil…) : repli ci-dessous */ }
  }
  // Téléphone en portrait : paysage simulé avec tous les boutons.
  if (innerHeight > innerWidth && innerWidth < 700) { setRotated(true); return; }
  // iPad / paysage sans plein écran autorisé : mode immersif (la vidéo occupe tout, boutons au toucher).
  setImmersive(true);
}

function setImmersive(on) {
  player.el.classList.toggle("immersive", on);
  updateFullscreenButton();
  if (on) { hideUI(); toast("Plein écran · touchez l'écran pour les commandes"); } else wake();
}

function setRotated(on) {
  player.el.classList.toggle("rotated", on);
  updateFullscreenButton();
  wake();
}

function updateFullscreenButton() {
  const html = isFullscreen() ? "<span>⛶</span>Quitter" : "<span>⛶</span>Plein écran";
  document.querySelectorAll(".btn-fs").forEach((b) => { b.innerHTML = html; });
}
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);
// Téléphone tourné en paysage : plus besoin de simuler.
addEventListener("resize", () => { if (player.el.classList.contains("rotated") && innerWidth > innerHeight) setRotated(false); });

// ---------------------------------------------------------------- image dans l'image (PiP)

const isPiP = () => document.pictureInPictureElement === video || video.webkitPresentationMode === "picture-in-picture";

function waitFor(test, ms) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => (test() ? resolve(true) : Date.now() - t0 > ms ? resolve(false) : setTimeout(tick, 100));
    tick();
  });
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * iOS n'autorise le PiP, AirPlay et son lecteur plein écran qu'avec son moteur vidéo natif.
 * Si le lecteur stable (hls.js) est utilisé, on bascule la lecture en cours sur le moteur natif.
 */
async function switchToNativeEngine() {
  if (!player.hls || !player.currentUrl || !canNativeHLS()) return;
  const position = video.currentTime;
  const live = player.mode === "live" && !player.shift;
  player.forceNative = true;
  player.hls.destroy();
  player.hls = null;
  video.disableRemotePlayback = false;
  video.src = proxy(player.currentUrl);
  await new Promise((r) => { video.addEventListener("loadedmetadata", r, { once: true }); setTimeout(r, 8000); });
  if (!live && position > 1) video.currentTime = position;
  await video.play().catch(() => {});
  $("#btn-airplay").classList.toggle("hidden", !video.webkitShowPlaybackTargetPicker);
}

const isStandalone = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;

async function togglePiP({ force = false } = {}) {
  // Apple ne permet pas le PiP dans les apps web de l'écran d'accueil (il marche dans Safari).
  if (!force && isIOS() && isStandalone() && !isPiP()) { offerSafariPiP(); return; }
  if (player.hls && isIOS()) {
    status("Préparation de l'image dans l'image…");
    await switchToNativeEngine();
    status("");
  }
  if (isPiP()) {
    if (document.pictureInPictureElement) await document.exitPictureInPicture().catch(() => {});
    else video.webkitSetPresentationMode("inline");
    return;
  }
  try {
    // Sans « await » : iOS n'accepte le PiP que dans le prolongement direct du toucher.
    if (video.paused) video.play().catch(() => {});
    if (video.webkitSupportsPresentationMode?.("picture-in-picture")) video.webkitSetPresentationMode("picture-in-picture");
    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
    else throw new Error("non pris en charge");
    // L'animation d'iOS prend un moment : on attend jusqu'à 2,5 s avant de conclure.
    if (!(await waitFor(isPiP, 2500))) throw new Error("refusé");
  } catch {
    if (isIOS() && isStandalone()) { offerSafariPiP(true); return; }
    // Après la bascule de moteur, iOS exige souvent un nouveau toucher.
    showPiPPrompt();
  }
}

// --- reprise de la lecture dans Safari, où le PiP fonctionne

function handoffURL() {
  const data = { t: Date.now() };
  if (syncState.code) data.code = syncState.code;
  else data.sources = activeSources();
  if (player.mode === "live" && player.stream) data.live = player.stream.id;
  else if (player.mode === "vod" && player.lastVOD) { data.vod = player.lastVOD; data.pos = video.currentTime || 0; data.dur = video.duration || 0; }
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${location.origin}/#handoff=${b64}`;
}

function offerSafariPiP(afterFailure = false) {
  openMenu("Image dans l'image", [
    { label: "Apple bloque l'image dans l'image dans les apps de l'écran d'accueil. Elle fonctionne dans Safari.", action: () => {} },
    { label: "▶ Continuer cette lecture dans Safari", action: () => {
      const url = handoffURL();
      saveVODProgress();
      video.pause();
      launchScheme(`x-safari-${url}`);
      setTimeout(() => {
        if (document.hidden) return;
        navigator.clipboard?.writeText(url).catch(() => {});
        toast("Lien copié : collez-le dans Safari");
      }, 1500);
    } },
    afterFailure ? null : { label: "Essayer quand même ici", action: () => togglePiP({ force: true }) },
  ].filter(Boolean));
}

function readHandoff() {
  const m = location.hash.match(/^#handoff=([\w-]+)/);
  if (!m) return null;
  history.replaceState(null, "", location.pathname);
  try {
    const b = atob(m[1].replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0))));
    return Date.now() - data.t < 10 * 60000 ? data : null; // lien valable 10 minutes
  } catch { return null; }
}

// --- glisser vers le haut : la vidéo part en image dans l'image et l'app reste utilisable derrière

let pipPromptTimer = null;
function showPiPPrompt() {
  const b = $("#pip-prompt");
  b.classList.remove("hidden");
  clearTimeout(pipPromptTimer);
  pipPromptTimer = setTimeout(() => b.classList.add("hidden"), 7000);
}
$("#pip-prompt").addEventListener("click", (e) => {
  e.stopPropagation();
  $("#pip-prompt").classList.add("hidden");
  swipeToPiP();
});

async function swipeToPiP() {
  if (!player.mode) return;
  if (isPiP()) { minimizeToPiP(); return; }
  if (isIOS() && isStandalone()) { offerSafariPiP(); return; }
  await togglePiP();
  if (isPiP()) minimizeToPiP();
}

// Détection en phase de capture : marche aussi quand le geste commence sur la barre de commandes.
let pipSwipeStart = null;
let pipSwiped = false;
player.el.addEventListener("touchstart", (e) => {
  pipSwiped = false;
  pipSwipeStart = null;
  if (!prefs.swipePiP || e.touches.length !== 1) return;
  if (e.target.closest("input, #channel-panel, #guide-panel, #menu, #numpad, .sheet")) return;
  const t = e.touches[0];
  const rotated = player.el.classList.contains("rotated");
  // Le « bas » de l'écran, tel que le voit l'utilisateur (y compris en mode tourné).
  const fromBottom = rotated ? t.clientX < innerWidth * 0.3 : t.clientY > innerHeight * 0.7;
  if (fromBottom) pipSwipeStart = { x: t.clientX, y: t.clientY };
}, { passive: true, capture: true });
player.el.addEventListener("touchend", (e) => {
  if (!pipSwipeStart) return;
  const t = e.changedTouches[0];
  let dx = t.clientX - pipSwipeStart.x;
  let dy = t.clientY - pipSwipeStart.y;
  if (player.el.classList.contains("rotated")) [dx, dy] = [dy, -dx];
  pipSwipeStart = null;
  if (dy < -90 && Math.abs(dy) > Math.abs(dx) * 1.5) {
    pipSwiped = true;
    e.preventDefault();
    swipeToPiP();
  }
}, { capture: true });

// En quittant l'app pendant la lecture, iOS bascule tout seul en image dans l'image (attribut autopictureinpicture)
// si le lecteur natif est utilisé ; on le demande aussi explicitement quand c'est possible.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden || !player.mode || player.hls || video.paused || isPiP()) return;
  try { if (video.webkitSupportsPresentationMode?.("picture-in-picture")) video.webkitSetPresentationMode("picture-in-picture"); } catch {}
});

async function openNativeFullscreen() {
  if (player.hls && isIOS()) { status("Préparation du plein écran iOS…"); await switchToNativeEngine(); status(""); }
  try {
    if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    else await video.requestFullscreen?.();
  } catch { toast("Touchez à nouveau pour ouvrir le plein écran iOS"); }
}

// Fermer le lecteur pendant le PiP : la vidéo continue dans la fenêtre flottante.
// Sortie du PiP : « agrandir » rouvre le lecteur, « fermer » arrête la lecture.
function onPiPChange() {
  if (isPiP()) return;
  if (!player.minimized) return;
  player.minimized = false;
  setTimeout(() => {
    if (!video.paused && video.currentSrc) {
      player.el.classList.remove("hidden");
      player.el.setAttribute("aria-hidden", "false");
      wake();
    } else {
      closePlayer();
    }
  }, 300);
}
video.addEventListener("webkitpresentationmodechanged", onPiPChange);
video.addEventListener("leavepictureinpicture", onPiPChange);

function minimizeToPiP() {
  closePanels();
  player.minimized = true;
  player.el.classList.add("hidden");
  player.el.setAttribute("aria-hidden", "true");
  if (currentTab === "live") renderShell();
}

document.addEventListener("epg", (e) => { if (e.detail === player.stream?.id) updateLiveEPG(); });
setInterval(updateLiveEPG, 30000);

function zap(offset) {
  const list = player.playlist;
  if (!list.length || !player.stream) return;
  const i = list.findIndex((s) => s.id === player.stream.id);
  playLive(list[(i + offset + list.length) % list.length]);
}
const zapDirection = (dir) => zap(prefs.invertZap ? -dir : dir);

function goPrevious() {
  if (!player.previous) { toast("Pas de chaîne précédente"); return; }
  const { stream, playlist, groupId } = player.previous;
  playLive(stream, playlist, groupId);
}

function groupTitle(id) {
  if (id === "__fav") return "Favoris";
  if (id === "__recent") return "Récents";
  if (id === "__all") return "Toutes les chaînes";
  if (id === "__replay") return "Chaînes avec replay";
  const cat = content.liveCats?.find((c) => c.id === id);
  return cat ? (multiSource() ? `${sourceName(cat)} · ${cat.name}` : cat.name) : "";
}

// --- liste des chaînes dépliante (style TiviMate)

const panel = { expanded: new Set(), rows: new Map(), source: store.get("ondetv.panelSource", "__all") };

function drawPanelSources() {
  const box = $("#panel-sources");
  const show = multiSource();
  box.classList.toggle("hidden", !show);
  if (!show) { panel.source = "__all"; return; }
  if (panel.source !== "__all" && !activeSources().some((x) => x.id === panel.source)) panel.source = "__all";
  box.replaceChildren(...[{ id: "__all", name: "Toutes les sources" }, ...activeSources()].map((src) => h("button", {
    class: `chip${panel.source === src.id ? " active" : ""}`,
    onclick: () => {
      panel.source = src.id;
      store.set("ondetv.panelSource", src.id);
      // On déplie directement la première catégorie de la source choisie.
      const first = content.liveCats.find((c) => src.id === "__all" || c.src === src.id);
      panel.expanded = new Set(first && src.id !== "__all" ? [first.id] : [player.groupId]);
      drawPanelSources();
      drawPanel();
      $("#panel-list").scrollTop = 0;
      wake();
    },
  }, src.name)));
}
const inPanelSource = (x) => panel.source === "__all" || x.src === panel.source;

function openChannelPanel(focus) {
  closePanels();
  const el = $("#channel-panel");
  el.classList.remove("hidden");
  $("#panel-search").value = "";
  panel.expanded = new Set([focus === "__recent" ? "__recent" : player.groupId]);
  if (player.stream && focus !== "__recent") {
    panel.expanded.add(`src|${player.stream.src}`);
    if (player.groupId === "__replay") { panel.expanded.add(`replay|${player.stream.src}`); panel.expanded.add(`replay|${player.stream.cat}`); }
  }
  $("#channel-panel-title").textContent = focus === "__recent" ? "Récents" : "Chaînes";
  // La source de la chaîne en cours est présélectionnée.
  if (multiSource() && panel.source !== "__all" && player.stream && focus !== "__recent") panel.source = player.stream.src;
  drawPanelSources();
  drawPanel();
  wake();
}

function closePanels() {
  for (const id of ["#channel-panel", "#guide-panel", "#numpad", "#menu"]) $(id).classList.add("hidden");
  clearTimeout(numpad.timer);
  numpad.value = "";
  player.panelObserver?.disconnect();
}

function drawPanel() {
  const list = $("#panel-list");
  const q = $("#panel-search").value.trim().toLowerCase();
  player.panelObserver?.disconnect();
  panel.rows.clear();
  list.replaceChildren();
  player.panelObserver = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { requestEPG(e.target.dataset.id); player.panelObserver.unobserve(e.target); }
  }, { root: list, rootMargin: "150px" });

  if (q) {
    const found = content.live.filter((s) => inPanelSource(s) && (s.name.toLowerCase().includes(q) || String(s.num) === q));
    if (!found.length) list.append(h("div", { class: "empty" }, "Aucune chaîne trouvée."));
    renderChunked(list, found, (s) => panelRow(s, found, "__all"), list, 80);
    return;
  }

  // Comme TiviMate : tout dans une seule liste dépliable — sources → groupes → chaînes.
  const multi = multiSource() && panel.source === "__all";
  const isOpen = (key) => panel.expanded.has(key);
  const head = (key, label, count, level, extra = "") => {
    const open = isOpen(key);
    const node = h("button", {
      class: `group-head lvl${level}${open ? " open" : ""}${key === player.groupId ? " current" : ""}${extra}`,
      onclick: () => { if (open) panel.expanded.delete(key); else panel.expanded.add(key); const top = node.offsetTop; drawPanel(); restoreGroup(key, top); },
    }, h("span", { class: "chev" }, "›"), label, h("span", { class: "count" }, count));
    node.dataset.group = key;
    list.append(node);
    return open;
  };
  const channelsBox = (channels, groupId, level) => {
    const box = h("div");
    list.append(box);
    renderChunked(box, channels, (s) => { const r = panelRow(s, channels, groupId); r.classList.add(`lvl${level}`); return r; }, list, 80);
  };
  const sourcesShown = activeSources().filter((src) => inPanelSource({ src: src.id }));
  const catsOf = (srcId) => content.liveCats.filter((c) => c.src === srcId && !isHiddenCat("live", c.id));

  // Récents, favoris
  for (const [key, label] of [["__recent", "🕘 Récents"], ["__fav", "★ Favoris"]]) {
    const channels = groupList(key).filter(inPanelSource);
    if (!channels.length && key !== "__fav") continue;
    if (head(key, label, channels.length, 1)) {
      if (!channels.length) list.append(h("div", { class: "empty", style: { padding: "16px" } }, "Touchez ☆ à côté d'une chaîne pour l'ajouter."));
      else channelsBox(channels, key, 1);
    }
  }

  // Chaînes avec replay : sources → groupes → chaînes
  const replayAll = groupList("__replay").filter(inPanelSource);
  if (replayAll.length && head("__replay", "⟲ Chaînes avec replay", replayAll.length, 1)) {
    for (const src of sourcesShown) {
      const ofSrc = replayAll.filter((x) => x.src === src.id);
      if (!ofSrc.length) continue;
      let level = 2;
      if (multi) { if (!head(`replay|${src.id}`, `📡 ${src.name}`, ofSrc.length, 2, " source")) continue; level = 3; }
      for (const c of catsOf(src.id)) {
        const chs = ofSrc.filter((x) => x.cat === c.id);
        if (chs.length && head(`replay|${c.id}`, c.name, chs.length, level)) channelsBox(chs, "__replay", level);
      }
    }
  }

  // Sources → groupes → chaînes
  for (const src of sourcesShown) {
    const cats = catsOf(src.id);
    let level = 1;
    if (multi) {
      const total = cats.reduce((n, c) => n + groupList(c.id).length, 0);
      if (!head(`src|${src.id}`, `📡 ${src.name}`, total, 1, " source")) continue;
      level = 2;
    }
    for (const c of cats) {
      const chs = groupList(c.id);
      if (chs.length && head(c.id, c.name, chs.length, level)) channelsBox(chs, c.id, level);
    }
  }

  // Toutes les chaînes
  const all = groupList("__all").filter(inPanelSource);
  if (head("__all", panel.source === "__all" ? "Toutes les chaînes" : `Toutes les chaînes · ${sourceName(panel.source)}`, all.length, 1)) channelsBox(all, "__all", 1);
  requestAnimationFrame(() => list.querySelector(".p-channel.playing")?.scrollIntoView({ block: "center" }));
}

function restoreGroup(groupId, top) {
  const head = $(`#panel-list [data-group="${CSS.escape(groupId)}"]`);
  if (head) $("#panel-list").scrollTop += head.offsetTop - top;
}

function panelRow(s, channels, groupId) {
  const isFav = library.favChannels.includes(s.id);
  const favBtn = h("span", { class: `fav${isFav ? " on" : ""}`, role: "button", "aria-label": "Favori" }, isFav ? "★" : "☆");
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle("favChannels", s.id);
    const on = library.favChannels.includes(s.id);
    favBtn.textContent = on ? "★" : "☆";
    favBtn.classList.toggle("on", on);
    if (player.stream?.id === s.id) $("#player-fav").textContent = on ? "★" : "☆";
    toast(on ? "Ajoutée aux favoris" : "Retirée des favoris");
  });
  const epgBtn = h("span", { class: "epg-btn", role: "button", "aria-label": "Programme de la chaîne" }, "📅");
  epgBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    $("#panel-list").querySelectorAll(".p-channel.focused").forEach((r) => r.classList.remove("focused"));
    row.classList.add("focused");
    openGuidePanel(s, { channels, groupId });
    wake();
  });
  const row = h("button", {
    class: `p-channel${player.stream?.id === s.id ? " playing" : ""}`, "data-id": s.id,
    onclick: () => { playLive(s, channels, groupId); if (prefs.closeListOnSelect) closePanels(); else wake(); },
  },
    h("span", { class: "num" }, s.num ?? ""), logoBox(s),
    h("div", { class: "info" }, h("div", { class: "name" }, s.name), h("div", { class: "now" }), h("div", { class: "bar hidden" }, h("i")),
      mixedGroup(groupId) ? h("div", { class: "cat-tag" }, categoryLabel(s)) : null),
    epgBtn, favBtn);
  panel.rows.set(s.id, [...(panel.rows.get(s.id) || []), row]);
  if (content.epg.has(s.id)) fillPanelRow(row, s.id); else player.panelObserver.observe(row);
  return row;
}

function fillPanelRow(row, id) {
  const p = nowProgram(id);
  row.querySelector(".now").textContent = p ? `${hm(p.start)} ${p.title}` : "";
  row.querySelector(".bar").classList.toggle("hidden", !p);
  if (p) row.querySelector(".bar i").style.width = `${progress(p)}%`;
}
document.addEventListener("epg", (e) => panel.rows.get(e.detail)?.forEach((r) => fillPanelRow(r, e.detail)));

function markPlayingInPanel() {
  for (const [id, rows] of panel.rows) rows.forEach((r) => r.classList.toggle("playing", id === player.stream?.id));
}

$("#panel-search").addEventListener("input", () => drawPanel());

// --- guide de la chaîne en cours (avec replay)

async function openGuidePanel(target, fromList = null) {
  const stream = target || player.stream;
  if (!stream) return;
  // Depuis la liste des chaînes, la liste reste ouverte à côté (comme TiviMate).
  if (fromList) { $("#guide-panel").classList.remove("hidden"); $("#guide-panel").classList.add("beside"); }
  else { closePanels(); $("#guide-panel").classList.remove("beside"); }
  const isCurrent = player.stream?.id === stream.id;
  const list = $("#guide-list");
  $("#guide-title").textContent = stream.archive ? `⟲ ${stream.name}` : stream.name;
  $("#guide-title").dataset.for = stream.id;
  list.replaceChildren(h("div", { class: "loading" }, "Programme…"));
  $("#guide-panel").classList.remove("hidden");
  wake();
  const all = await loadFullEPG(stream);
  if ($("#guide-title").dataset.for !== stream.id) return;
  if (fullEPGCache.get(stream.id)?.pastChecked === "loading") {
    const onPast = (e) => {
      if (e.detail.id !== stream.id) return;
      document.removeEventListener("fullepg", onPast);
      if ($("#guide-title").dataset.for === stream.id && !$("#guide-panel").classList.contains("hidden")) {
        if (e.detail.added) openGuidePanel(stream, fromList);
        else list.querySelector(".past-search")?.replaceChildren("Votre fournisseur ne propose pas de programmes plus anciens pour cette chaîne.");
      }
    };
    document.addEventListener("fullepg", onPast);
    queueMicrotask(() => list.prepend(h("div", { class: "guide-note past-search" }, "⏳ Recherche des jours précédents dans le guide complet du fournisseur…")));
  }
  const now = new Date();
  const programs = all.filter((p) => p.end > now - (stream.archiveDays * 86400000 + 3600000));
  list.replaceChildren(h("div", { class: "guide-note" }, stream.archive
    ? `Replay disponible sur ${stream.archiveDays} jour${stream.archiveDays > 1 ? "s" : ""} : touchez un programme passé (▶) pour le revoir, ou le programme en cours pour le reprendre au début.`
    : "Cette chaîne ne propose pas de replay chez votre fournisseur. Les chaînes avec replay sont marquées ⟲ (catégorie « Chaînes avec replay »)."));
  if (!programs.length) { list.append(h("div", { class: "empty" }, "Aucun programme disponible.")); return; }
  if (programs[0]?.public) list.append(h("div", { class: "guide-note" }, "Programme issu d'un guide public (xmltvfr.fr / dobleM) : votre fournisseur n'en fournit pas pour cette chaîne."));

  // Raccourcis par jour, comme le guide de TiviMate
  const dayKey = (d) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now - 86400000));
  const days = [...new Set(programs.map((p) => dayKey(p.start)))];
  const dayLabel = (d) => d === today ? "Aujourd'hui" : d === yesterday ? "Hier" : d.split(" ").slice(0, 2).join(" ");
  const anchors = new Map();
  if (days.length > 1) {
    list.append(h("div", { class: "guide-days" }, days.map((d) => h("button", {
      class: `chip${d === today ? " active" : ""}`,
      onclick: (e) => {
        list.querySelectorAll(".guide-days .chip").forEach((c) => c.classList.remove("active"));
        e.currentTarget.classList.add("active");
        anchors.get(d)?.scrollIntoView({ block: "start" });
      },
    }, dayLabel(d)))));
  }

  let lastDay = "";
  let liveRow = null;
  for (const p of programs) {
    const day = dayKey(p.start);
    if (day !== lastDay) { const head = h("div", { class: "day", style: { padding: "0 16px" } }, day); anchors.set(day, head); list.append(head); lastDay = day; }
    const live = p.start <= now && now < p.end;
    const past = p.end <= now;
    const replay = past && stream.archive && (p.archive || p.start > now - stream.archiveDays * 86400000);
    const row = h("button", {
      class: `program${live ? " live" : ""}${past ? " past" : ""}${replay ? " replay" : ""}`, style: { padding: "10px 16px" },
      onclick: () => {
        if (replay) { closePanels(); playCatchup(stream, p); }
        else if (live && !isCurrent) { closePanels(); playLive(stream, fromList?.channels, fromList?.groupId); }
        else if (live && stream.archive) { closePanels(); shiftTo(new Date(p.start.getTime() + 1000)); toast(`Reprise au début : ${p.title}`); }
        else if (live) { closePanels(); goLive(); }
        else row.querySelector(".d")?.classList.toggle("open");
      },
    },
      h("span", { class: "time" }, hm(p.start)),
      h("span", { style: { flex: 1, minWidth: 0 } },
        h("div", {}, p.title,
          live ? h("span", { class: "tag" }, stream.archive ? "EN DIRECT · ⏮ reprendre au début" : "EN DIRECT")
            : replay ? h("span", { class: "tag" }, "▶ REVOIR") : null),
        p.description ? h("div", { class: "d muted", style: { fontSize: "13px" } }, p.description) : null));
    if (live) liveRow = row;
    list.append(row);
  }
  liveRow?.scrollIntoView({ block: "center" });
}

// --- saisie du numéro de chaîne

const numpad = { value: "", timer: null };
function openNumpad(firstDigit = "") {
  closePanels();
  numpad.value = "";
  $("#numpad").classList.remove("hidden");
  updateNumpad();
  if (firstDigit) typeDigit(firstDigit);
  wake();
}
function updateNumpad() {
  $("#numpad-display").textContent = numpad.value || "—";
  // Numéro cherché d'abord dans la source de la chaîne en cours (les numéros se répètent entre sources).
  const match = numpad.value && findByNumber(numpad.value);
  $("#numpad-hint").textContent = numpad.value ? (match ? match.name : "Aucune chaîne") : "Numéro de chaîne";
}
function findByNumber(n) {
  const same = content.live.find((s) => String(s.num) === n && s.src === player.stream?.src);
  return same || content.live.find((s) => String(s.num) === n);
}
function typeDigit(d) {
  if (numpad.value.length >= 5) return;
  numpad.value += d;
  updateNumpad();
  clearTimeout(numpad.timer);
  numpad.timer = setTimeout(confirmNumber, 2000);
}
function confirmNumber() {
  clearTimeout(numpad.timer);
  const match = numpad.value && findByNumber(numpad.value);
  $("#numpad").classList.add("hidden");
  if (match) {
    const inGroup = groupList(player.groupId).some((s) => s.id === match.id);
    if (inGroup) playLive(match); else playLive(match, content.live, "__all");
  }
  else if (numpad.value) toast(`Chaîne ${numpad.value} introuvable`);
  numpad.value = "";
}
$("#numpad").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  wake();
  if (b.dataset.key === "del") { numpad.value = numpad.value.slice(0, -1); updateNumpad(); clearTimeout(numpad.timer); }
  else if (b.dataset.key === "ok") confirmNumber();
  else typeDigit(b.textContent);
});

// --- menus (options, format, veille)

function openMenu(title, items) {
  closePanels();
  const m = $("#menu");
  m.replaceChildren(h("div", { class: "menu-title" }, title), ...items.map((it) => h("button", {
    class: it.selected ? "sel" : "",
    onclick: () => { m.classList.add("hidden"); it.action(); wake(); },
  }, h("span", {}, it.label), it.value != null ? h("span", { class: "val" }, it.value) : (it.selected ? h("span", {}, "✓") : null))));
  m.classList.remove("hidden");
  wake();
}

function setSleep(minutes, silent = false) {
  clearTimeout(player.sleepTimer);
  player.sleepTimer = null;
  player.sleepAt = null;
  if (minutes > 0) {
    player.sleepAt = Date.now() + minutes * 60000;
    player.sleepTimer = setTimeout(() => { closePlayer(); }, minutes * 60000);
    if (!silent) toast(`Arrêt automatique dans ${minutes} min`);
  } else if (!silent) toast("Minuterie désactivée");
}

function openOptions() {
  const sleepLeft = player.sleepAt ? `${Math.ceil((player.sleepAt - Date.now()) / 60000)} min` : "Désactivée";
  const stream = player.stream;
  openMenu("Options", [
    { label: "Qualité d'image", value: qualityName(video.videoHeight) || "—", action: openQualityMenu },
    { label: "Format d'image", value: ASPECTS.find((a) => a.id === player.aspect).label, action: openAspectMenu },
    { label: "Minuterie de mise en veille", value: sleepLeft, action: () => openMenu("Mise en veille", [0, 15, 30, 60, 90, 120].map((m) => ({
      label: m ? `${m} minutes` : "Désactivée", selected: m === 0 && !player.sleepAt, action: () => setSleep(m),
    }))) },
    stream ? { label: library.favChannels.includes(stream.id) ? "Retirer des favoris" : "Ajouter aux favoris", action: toggleCurrentFav } : null,
    { label: "Ouvrir dans VLC", action: () => openInVLC(currentDirectURL()) },
    { label: "Image dans l'image (PiP)", action: togglePiP },
    { label: isFullscreen() ? "Quitter le plein écran" : "Plein écran", action: toggleFullscreen },
    { label: "Lecteur iOS natif (PiP, AirPlay)", action: openNativeFullscreen },
    { label: "Recharger la chaîne", action: retry },
    { label: "Informations du flux", action: () => toast(video.videoWidth ? `${qualityName(video.videoHeight)} · ${video.videoWidth}×${video.videoHeight} · ${player.hls ? `lecteur stable · réserve ${Math.round(bufferAhead())} s` : "lecteur natif Safari"}` : "Flux non chargé") },
    { label: "Préférences du lecteur", action: openPrefsMenu },
  ].filter(Boolean));
}

function openAspectMenu() {
  openMenu("Format d'image", ASPECTS.map((a) => ({
    label: a.label, selected: a.id === player.aspect,
    action: () => { player.aspect = a.id; prefs.aspect = a.id; savePrefs(); applyAspect(); toast(`Format : ${a.label}`); },
  })));
}

function cycleAspect() {
  const i = ASPECTS.findIndex((a) => a.id === player.aspect);
  player.aspect = ASPECTS[(i + 1) % ASPECTS.length].id;
  prefs.aspect = player.aspect;
  savePrefs();
  applyAspect();
  toast(`Format : ${ASPECTS.find((a) => a.id === player.aspect).label}`);
}

const PREF_LABELS = [
  ["tapOpensList", "Toucher la vidéo ouvre la liste des chaînes"],
  ["swipePiP", "Glisser vers le haut depuis le bas : image dans l'image"],
  ["swipeZap", "Zapper en glissant haut / bas"],
  ["invertZap", "Inverser le sens du zapping"],
  ["bannerOnZap", "Bandeau d'infos au changement de chaîne"],
  ["closeListOnSelect", "Fermer la liste après sélection"],
  ["resumeLastChannel", "Relancer la dernière chaîne au démarrage"],
  ["nativeEngine", "Lecteur natif Safari (AirPlay, mais moins stable)"],
  ["vlcForSpecial", "Ouvrir les formats spéciaux (MKV, AVI…) dans VLC"],
  ["publicEpg", "Compléter le guide avec les guides publics (France, Espagne)"],
];
function openPrefsMenu() {
  openMenu("Préférences du lecteur", PREF_LABELS.map(([key, label]) => ({
    label, value: prefs[key] ? "Oui" : "Non",
    action: () => { prefs[key] = !prefs[key]; savePrefs(); openPrefsMenu(); },
  })));
}

function toggleCurrentFav() {
  if (!player.stream) return;
  toggle("favChannels", player.stream.id);
  const on = library.favChannels.includes(player.stream.id);
  $("#player-fav").textContent = on ? "★" : "☆";
  toast(on ? "Ajoutée aux favoris" : "Retirée des favoris");
}

// --- films, épisodes, replay

function playCatchup(stream, program) {
  player.catchupFrom = stream;
  playVOD(urls.catchup(stream, program), program.title,
    `${stream.name} · ${program.start.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`, null);
}

function playVOD(url, title, subtitle, progressKey, { forceInternal = false } = {}) {
  const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
  if (!forceInternal && Native && isSpecialFormat(ext)) { playNative(url, title, subtitle, progressKey); return; }
  if (!forceInternal && prefs.vlcForSpecial && isSpecialFormat(ext)) { openInVLC(url); return; }
  closePanels();
  player.progressKey = progressKey;
  player.lastVOD = [url, title, subtitle, progressKey];
  openPlayer("vod", title, subtitle);
  const p = progressKey ? library.progress[progressKey] : null;
  startVideo(url, p && p.pos / p.dur < 0.95 ? p.pos : 0);
  clearInterval(player.saveTimer);
  player.saveTimer = setInterval(saveVODProgress, 10000);
}

function saveVODProgress() {
  if (player.mode !== "vod" || !player.progressKey || !Number.isFinite(video.duration) || video.currentTime < 10) return;
  library.progress[player.progressKey] = { pos: video.currentTime, dur: video.duration, t: Date.now() };
  saveLibrary(30000);
}

// --- commandes des films, séries et replays (mêmes options que le direct)

const fmtTime = (sec) => {
  if (!Number.isFinite(sec)) return "0:00";
  const t = Math.max(0, Math.floor(sec)), hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
  return hh ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${mm}:${String(ss).padStart(2, "0")}`;
};
const vodRange = $("#vod-range");
function updateVodUI() {
  if (player.mode !== "vod") return;
  const d = Number.isFinite(video.duration) ? video.duration : 0;
  const dragging = vodRange.dataset.dragging === "1";
  if (!dragging) {
    vodRange.value = d ? Math.round((video.currentTime / d) * 1000) : 0;
    $("#vod-time").textContent = fmtTime(video.currentTime);
  }
  $("#vod-duration").textContent = d ? `-${fmtTime(d - video.currentTime)}` : "";
  vodRange.style.setProperty("--pos", `${(vodRange.value / 10)}%`);
  vodRange.style.setProperty("--avail", d ? `${Math.min(100, ((video.currentTime + bufferAhead()) / d) * 100)}%` : "0%");
  updatePauseButton();
}
video.addEventListener("timeupdate", updateVodUI);
video.addEventListener("pause", updateVodUI);
video.addEventListener("play", updateVodUI);
vodRange.addEventListener("pointerdown", () => { vodRange.dataset.dragging = "1"; });
vodRange.addEventListener("touchstart", () => { vodRange.dataset.dragging = "1"; }, { passive: true });
vodRange.addEventListener("input", () => {
  wake();
  const d = video.duration || 0;
  $("#vod-time").textContent = fmtTime((vodRange.value / 1000) * d);
  vodRange.style.setProperty("--pos", `${vodRange.value / 10}%`);
});
vodRange.addEventListener("change", () => {
  vodRange.dataset.dragging = "";
  const d = video.duration;
  if (Number.isFinite(d)) video.currentTime = (vodRange.value / 1000) * d;
});

function seekBy(sec) {
  if (!Number.isFinite(video.duration)) return;
  video.currentTime = Math.min(Math.max(0, video.currentTime + sec), video.duration - 1);
  updateVodUI();
}

function openTracksMenu() {
  const items = [];
  const hls = player.hls;
  if (hls && hls.audioTracks?.length > 1) {
    hls.audioTracks.forEach((t, i) => items.push({ label: `🔊 ${t.name || t.lang || `Piste ${i + 1}`}`, selected: hls.audioTrack === i, action: () => { hls.audioTrack = i; } }));
  } else if (video.audioTracks?.length > 1) {
    [...video.audioTracks].forEach((t, i) => items.push({ label: `🔊 ${t.label || t.language || `Piste ${i + 1}`}`, selected: t.enabled, action: () => { [...video.audioTracks].forEach((x, j) => { x.enabled = j === i; }); } }));
  }
  if (hls && hls.subtitleTracks?.length) {
    items.push({ label: "💬 Sans sous-titres", selected: hls.subtitleTrack === -1, action: () => { hls.subtitleTrack = -1; } });
    hls.subtitleTracks.forEach((t, i) => items.push({ label: `💬 ${t.name || t.lang || `Sous-titres ${i + 1}`}`, selected: hls.subtitleTrack === i, action: () => { hls.subtitleTrack = i; hls.subtitleDisplay = true; } }));
  } else if (video.textTracks?.length) {
    const tracks = [...video.textTracks].filter((t) => t.kind === "subtitles" || t.kind === "captions");
    if (tracks.length) {
      items.push({ label: "💬 Sans sous-titres", selected: tracks.every((t) => t.mode !== "showing"), action: () => tracks.forEach((t) => { t.mode = "disabled"; }) });
      tracks.forEach((t, i) => items.push({ label: `💬 ${t.label || t.language || `Sous-titres ${i + 1}`}`, selected: t.mode === "showing", action: () => tracks.forEach((x, j) => { x.mode = j === i ? "showing" : "disabled"; }) }));
    }
  }
  if (!items.length) items.push({ label: "Une seule piste audio, pas de sous-titres", action: () => {} });
  items.push({ label: "Plus de pistes ? Ouvrir dans VLC", action: () => openInVLC(currentDirectURL()) });
  openMenu("Pistes audio et sous-titres", items);
}

function openSpeedMenu() {
  openMenu("Vitesse de lecture", [0.75, 1, 1.25, 1.5, 2].map((r) => ({
    label: `×${r}`, selected: video.playbackRate === r,
    action: () => { video.playbackRate = r; $("#vod-speed").innerHTML = `<span>⏱</span>×${r}`; },
  })));
}

function openVodOptions() {
  const sleepLeft = player.sleepAt ? `${Math.ceil((player.sleepAt - Date.now()) / 60000)} min` : "Désactivée";
  openMenu("Options", [
    { label: "Pistes audio et sous-titres", action: openTracksMenu },
    { label: "Qualité d'image", value: qualityName(video.videoHeight) || "—", action: openQualityMenu },
    { label: "Vitesse de lecture", value: `×${video.playbackRate}`, action: openSpeedMenu },
    { label: "Format d'image", value: ASPECTS.find((a) => a.id === player.aspect).label, action: openAspectMenu },
    { label: "Minuterie de mise en veille", value: sleepLeft, action: () => openMenu("Mise en veille", [0, 15, 30, 60, 90, 120].map((m) => ({
      label: m ? `${m} minutes` : "Désactivée", selected: m === 0 && !player.sleepAt, action: () => setSleep(m),
    }))) },
    { label: isFullscreen() ? "Quitter le plein écran" : "Plein écran", action: toggleFullscreen },
    { label: "Ouvrir dans VLC", action: () => openInVLC(currentDirectURL()) },
    { label: "Image dans l'image (PiP)", action: togglePiP },
    { label: "Lecteur iOS natif (AirPlay)", action: openNativeFullscreen },
    { label: "Recommencer depuis le début", action: () => { video.currentTime = 0; } },
  ]);
}

$("#vod-ui").addEventListener("click", (e) => {
  const b = e.target.closest("[data-vod]");
  if (!b) return;
  wake();
  ({
    back: () => seekBy(-10),
    forward: () => seekBy(30),
    play: togglePause,
    tracks: openTracksMenu,
    quality: openQualityMenu,
    speed: openSpeedMenu,
    fullscreen: toggleFullscreen,
    aspect: cycleAspect,
    vlc: () => openInVLC(currentDirectURL()),
    more: openVodOptions,
  })[b.dataset.vod]?.();
});
["pointermove", "touchstart"].forEach((ev) => $("#vod-ui").addEventListener(ev, () => wake(), { passive: true }));

// --- qualité d'image

function qualityName(height) {
  if (!height) return "";
  if (height >= 2000) return "4K";
  if (height >= 1000) return "1080p";
  if (height >= 700) return "720p";
  if (height >= 520) return "576p";
  return `${height}p`;
}
function qualityLong(height) {
  const n = qualityName(height);
  return { "4K": "4K Ultra HD", "1080p": "1080p · Full HD", "720p": "720p · HD", "576p": "576p · SD" }[n] || (n ? `${n} · SD` : "inconnue");
}

function updateQualityBadge() {
  const b = $("#quality-badge");
  const hgt = video.videoHeight;
  const name = qualityName(hgt);
  b.classList.toggle("hidden", !name || !player.mode);
  b.textContent = name === "1080p" ? "FHD" : name === "720p" ? "HD" : name;
  b.classList.toggle("q4k", name === "4K");
  b.classList.toggle("qfhd", name === "1080p");
}
video.addEventListener("loadedmetadata", updateQualityBadge);
video.addEventListener("resize", updateQualityBadge);
video.addEventListener("emptied", () => $("#quality-badge").classList.add("hidden"));

/** Nom d'une chaîne sans préfixe de pays ni mention de qualité, pour trouver ses autres versions. */
function baseChannelName(name) {
  return String(name || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/^\s*(\[[^\]]*\]|\|[^|]*\||[a-z]{2,4}\s*[:|]|[a-z]{2,3}\s+-\s+)\s*/, "")
    .replace(/\b(uhd|fhd|hd|sd|hq|lq|4k|8k|hevc|h\.?265|h\.?264|1080[pi]?|720p?|2160p?|576p?|480p?|50 ?fps|60 ?fps|backup|bkp|raw|vip|low|high|multi)\b/g, " ")
    .replace(/[^a-z0-9+]/g, "");
}
function qualityHint(name) {
  const n = String(name).toLowerCase();
  if (/\b(4k|uhd|2160p?)\b/.test(n)) return 2160;
  if (/\b(fhd|1080[pi]?)\b/.test(n)) return 1080;
  if (/\b(hd|720p?)\b/.test(n)) return 720;
  if (/\b(sd|576p?|480p?|lq|low)\b/.test(n)) return 480;
  return 0;
}
function otherVersions(stream) {
  const base = baseChannelName(stream.name);
  if (!base) return [];
  return content.live.filter((x) => x.id !== stream.id && baseChannelName(x.name) === base)
    .sort((a, b) => qualityHint(b.name) - qualityHint(a.name));
}

function openQualityMenu() {
  const items = [];
  const hls = player.hls;
  const current = video.videoHeight ? `${qualityLong(video.videoHeight)} (${video.videoWidth}×${video.videoHeight})` : "en cours de chargement";
  if (hls && hls.levels?.length > 1) {
    const auto = hls.autoLevelEnabled;
    items.push({ label: `Auto${auto ? ` · ${qualityName(hls.levels[hls.currentLevel]?.height) || "…"}` : ""}`, selected: auto, action: () => { hls.currentLevel = -1; toast("Qualité automatique"); } });
    hls.levels.map((l, i) => ({ l, i })).sort((a, b) => (b.l.height || 0) - (a.l.height || 0)).forEach(({ l, i }) => {
      const kbps = l.bitrate ? ` · ${(l.bitrate / 1e6).toFixed(1)} Mb/s` : "";
      items.push({ label: `${qualityLong(l.height)}${kbps}`, selected: !auto && hls.currentLevel === i,
        action: () => { hls.currentLevel = i; toast(`Qualité : ${qualityName(l.height) || "choisie"}`); } });
    });
  } else {
    const rate = hls?.levels?.[0]?.bitrate ? ` · ${(hls.levels[0].bitrate / 1e6).toFixed(1)} Mb/s` : "";
    items.push({ label: `Qualité actuelle : ${current}${rate}`, action: () => {} });
    items.push({ label: "Ce flux n'est proposé qu'en une seule qualité par votre fournisseur", action: () => {} });
  }
  if (player.mode === "live" && player.stream) {
    const others = otherVersions(player.stream);
    if (others.length) {
      items.push({ label: "— Autres versions de cette chaîne —", action: () => {} });
      for (const o of others) {
        const q = qualityHint(o.name);
        items.push({ label: `${o.name}${q ? ` (${qualityName(q)})` : ""}${multiSource() ? ` · ${sourceName(o)}` : ""}`, action: () => playLive(o) });
      }
    }
  }
  openMenu(`Qualité d'image · ${qualityName(video.videoHeight) || "…"}`, items);
}
$("#quality-badge").addEventListener("click", () => { wake(); openQualityMenu(); });

// --- grandes commandes au centre
$("#center-controls").addEventListener("click", (e) => {
  const b = e.target.closest("[data-center]");
  if (!b) return;
  wake();
  const live = player.mode === "live";
  ({
    play: togglePause,
    back: () => (live ? skip(-30) : seekBy(-10)),
    forward: () => (live ? skip(30) : seekBy(30)),
    chprev: () => zap(-1),
    chnext: () => zap(1),
  })[b.dataset.center]?.();
});

// --- commandes et gestes

$("#player-close").addEventListener("click", () => {
  if (isPiP()) { minimizeToPiP(); return; }
  // Depuis un replay, on revient au direct de la chaîne (comme TiviMate).
  if (player.mode === "vod" && player.catchupFrom) { const s = player.catchupFrom; player.catchupFrom = null; saveVODProgress(); playLive(s); return; }
  player.catchupFrom = null;
  closePlayer();
});
$("#player-fav").addEventListener("click", toggleCurrentFav);
$("#btn-pip").addEventListener("click", togglePiP);
$("#btn-airplay").addEventListener("click", () => video.webkitShowPlaybackTargetPicker?.());
player.el.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-panel-close]");
  if (!btn) return;
  // Guide ouvert depuis la liste : on ne ferme que le guide et on revient à la liste.
  const guide = $("#guide-panel");
  if (guide.contains(btn) && guide.classList.contains("beside")) {
    guide.classList.add("hidden");
    $("#panel-list").querySelectorAll(".p-channel.focused").forEach((r) => r.classList.remove("focused"));
  } else closePanels();
  wake();
});

$("#live-ui").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  wake();
  ({
    list: () => openChannelPanel(),
    recents: () => openChannelPanel("__recent"),
    previous: goPrevious,
    guide: openGuidePanel,
    number: () => openNumpad(),
    pause: togglePause,
    back: () => skip(-30),
    forward: () => skip(30),
    restart: restartProgram,
    golive: goLive,
    quality: openQualityMenu,
    fullscreen: toggleFullscreen,
    vlc: () => openInVLC(currentDirectURL()),
    aspect: cycleAspect,
    more: openOptions,
  })[b.dataset.act]?.();
});

// Toucher la vidéo : commandes ou liste ; double toucher : chaîne précédente ; glisser : zapping.
const tap = $("#tap-layer");
let touchStart = null;
let lastTap = 0;
let singleTapTimer = null;
tap.addEventListener("touchstart", (e) => { const t = e.touches[0]; touchStart = { x: t.clientX, y: t.clientY, time: Date.now() }; }, { passive: true });
tap.addEventListener("touchend", (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  let dx = t.clientX - touchStart.x;
  let dy = t.clientY - touchStart.y;
  if (player.el.classList.contains("rotated")) [dx, dy] = [dy, -dx];
  touchStart = null;
  if (pipSwiped) { e.preventDefault(); return; }
  if (prefs.swipeZap && player.mode === "live" && Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.5) {
    zapDirection(dy < 0 ? 1 : -1);
    e.preventDefault();
    return;
  }
  if (player.mode === "live" && Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx > 0) openChannelPanel(); else openGuidePanel();
    e.preventDefault();
    return;
  }
  e.preventDefault();
  handleTap();
});
tap.addEventListener("click", () => handleTap());

function handleTap() {
  const now = Date.now();
  if (now - lastTap < 300) {
    clearTimeout(singleTapTimer); lastTap = 0;
    if (player.mode === "live") goPrevious(); else togglePause();
    return;
  }
  lastTap = now;
  clearTimeout(singleTapTimer);
  singleTapTimer = setTimeout(() => {
    if (anyOverlayOpen()) { closePanels(); wake(); return; }
    if (prefs.tapOpensList && player.mode === "live") { openChannelPanel(); return; }
    if (player.el.classList.contains("idle")) wake(); else hideUI();
  }, 260);
}
["pointermove", "touchstart"].forEach((ev) => $("#live-ui").addEventListener(ev, () => wake(), { passive: true }));
$("#channel-panel").addEventListener("scroll", () => wake(), { passive: true, capture: true });

// Clavier (iPad avec clavier, télécommande Bluetooth, ordinateur)
document.addEventListener("keydown", (e) => {
  if (player.el.classList.contains("hidden") || e.target.matches("input")) return;
  const live = player.mode === "live";
  if (e.key === "Escape" || e.key === "Backspace") {
    if (anyOverlayOpen()) closePanels(); else $("#player-close").click();
  } else if (live && /^[0-9]$/.test(e.key)) {
    if ($("#numpad").classList.contains("hidden")) openNumpad(e.key); else typeDigit(e.key);
  } else if (live && !anyOverlayOpen() && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
    zapDirection(e.key === "ArrowUp" ? -1 : 1);
  } else if (live && !anyOverlayOpen() && e.key === "ArrowLeft") {
    openChannelPanel();
  } else if (live && !anyOverlayOpen() && e.key === "ArrowRight") {
    openGuidePanel();
  } else if (live && e.key === "Enter" && !$("#numpad").classList.contains("hidden")) {
    confirmNumber();
  } else if (live && e.key === "Enter" && !anyOverlayOpen()) {
    openChannelPanel();
  } else if (live && (e.key === "j" || e.key === "J")) {
    skip(-30);
  } else if (live && (e.key === "l" || e.key === "L")) {
    skip(30);
  } else if (!live && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    seekBy(e.key === "ArrowLeft" ? -10 : 30);
  } else if (e.key === "f" || e.key === "F") {
    toggleFullscreen();
  } else if (e.key === " ") {
    togglePause();
  } else return;
  e.preventDefault();
  wake();
});
document.addEventListener("visibilitychange", () => { if (document.hidden) saveVODProgress(); });

// ---------------------------------------------------------------- synchronisation entre appareils
// Les sources, favoris, chaînes récentes et reprises de lecture sont chiffrés sur l'appareil
// (AES-GCM, clé dérivée du code de synchronisation) puis déposés sur le serveur /sync/<empreinte>.
// Le serveur ne voit jamais les mots de passe IPTV.

const syncState = { code: store.get("ondetv.syncCode", null), last: store.get("ondetv.syncLast", 0), timer: null, running: null, error: null, persistent: null };
library.meta ??= { sourcesAt: 0, favAt: 0, recentsAt: 0 };

const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const fmtCode = (c) => (normCode(c).match(/.{1,4}/g) || []).join("-");
function newSyncCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}
function toB64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const fromB64 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
async function syncId(code) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ondetv-id:${normCode(code)}`));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const keyCache = new Map();
async function syncKey(code) {
  const c = normCode(code);
  if (!keyCache.has(c)) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(c), "PBKDF2", false, ["deriveKey"]);
    keyCache.set(c, await crypto.subtle.deriveKey({ name: "PBKDF2", salt: new TextEncoder().encode("ondetv-sync-v1"), iterations: 150000, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]));
  }
  return keyCache.get(c);
}
async function encryptSnapshot(obj, code) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await syncKey(code), new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(iv.length + data.length);
  out.set(iv); out.set(data, iv.length);
  return toB64(out);
}
async function decryptSnapshot(blob, code) {
  const bytes = fromB64(blob);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(0, 12) }, await syncKey(code), bytes.subarray(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

function snapshot() {
  return {
    v: 1,
    sources,
    meta: library.meta,
    favChannels: library.favChannels, favMovies: library.favMovies, favSeries: library.favSeries,
    recents: library.recents, lastChannel: library.lastChannel || null,
    progress: library.progress,
    hidden: library.hidden,
  };
}

/** Fusion : la version la plus récente gagne pour chaque partie ; reprises de lecture fusionnées une par une. */
function mergeRemote(remote) {
  const m = library.meta;
  const rm = remote.meta || {};
  let sourcesChanged = false;
  if ((rm.sourcesAt || 0) > (m.sourcesAt || 0) && Array.isArray(remote.sources)) {
    sources = remote.sources; m.sourcesAt = rm.sourcesAt; sourcesChanged = true;
  }
  if ((rm.favAt || 0) > (m.favAt || 0)) {
    library.favChannels = remote.favChannels || []; library.favMovies = remote.favMovies || []; library.favSeries = remote.favSeries || [];
    m.favAt = rm.favAt;
  }
  if ((rm.recentsAt || 0) > (m.recentsAt || 0)) {
    library.recents = remote.recents || []; library.lastChannel = remote.lastChannel || null; m.recentsAt = rm.recentsAt;
  }
  if ((rm.groupsAt || 0) > (m.groupsAt || 0) && remote.hidden) { library.hidden = remote.hidden; m.groupsAt = rm.groupsAt; }
  for (const [k, v] of Object.entries(remote.progress || {})) {
    const mine = library.progress[k];
    if (!mine || (v.t || 0) > (mine.t || 0)) library.progress[k] = v;
  }
  return sourcesChanged;
}

/** Première liaison d'un appareil qui a déjà ses propres sources : on réunit les deux. */
function joinMerge(remote) {
  const keyOf = (s) => `${s.server}|${s.username}`;
  const remoteSources = Array.isArray(remote.sources) ? remote.sources : [];
  const byKey = new Map(remoteSources.map((s) => [keyOf(s), s]));
  const idMap = new Map();
  const merged = [...remoteSources];
  for (const s of sources) {
    const same = byKey.get(keyOf(s));
    if (same) { if (same.id !== s.id) idMap.set(s.id, same.id); }
    else merged.push(s);
  }
  const remap = (k) => { const i = String(k).indexOf(":"); const src = String(k).slice(0, i); return idMap.has(src) ? `${idMap.get(src)}${String(k).slice(i)}` : k; };
  const remapProgressKey = (k) => k.replace(/^(movie|episode)-([^:]+):/, (all, kind, src) => idMap.has(src) ? `${kind}-${idMap.get(src)}:` : all);
  const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];
  library.favChannels = union(remote.favChannels, library.favChannels.map(remap));
  library.favMovies = union(remote.favMovies, library.favMovies.map(remap));
  library.favSeries = union(remote.favSeries, library.favSeries.map(remap));
  library.recents = union(remote.recents, library.recents.map(remap)).slice(0, 30);
  const progress = { ...(remote.progress || {}) };
  for (const [k, v] of Object.entries(library.progress)) {
    const nk = remapProgressKey(k);
    if (!progress[nk] || (v.t || 0) > (progress[nk].t || 0)) progress[nk] = v;
  }
  library.progress = progress;
  library.lastChannel = remote.lastChannel || (library.lastChannel ? { ...library.lastChannel, id: remap(library.lastChannel.id) } : null);
  sources = merged;
  const rh = remote.hidden || {};
  library.hidden = { live: union(rh.live, library.hidden?.live?.map(remap)), vod: union(rh.vod, library.hidden?.vod?.map(remap)), series: union(rh.series, library.hidden?.series?.map(remap)) };
  const now = Date.now();
  library.meta = { sourcesAt: now, favAt: now, recentsAt: now, groupsAt: now };
}

async function syncNow({ join = false } = {}) {
  if (!syncState.code) return;
  if (syncState.running) return syncState.running;
  syncState.running = (async () => {
    try {
      const id = await syncId(syncState.code);
      const res = await fetch(`/sync/${id}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      let remote = null;
      if (body.blob) {
        try { remote = await decryptSnapshot(body.blob, syncState.code); }
        catch { throw new Error("Données illisibles avec ce code"); }
      }
      const before = JSON.stringify(sources);
      const viewBefore = JSON.stringify([library.hidden, library.favChannels, library.favMovies, library.favSeries]);
      if (remote) { if (join) joinMerge(remote); else mergeRemote(remote); }
      const viewChanged = JSON.stringify([library.hidden, library.favChannels, library.favMovies, library.favSeries]) !== viewBefore;
      const local = snapshot();
      if (!remote || JSON.stringify(local) !== JSON.stringify(remote)) {
        const put = await fetch(`/sync/${id}`, { method: "PUT", body: await encryptSnapshot(local, syncState.code) });
        if (!put.ok) throw new Error(`Envoi refusé (HTTP ${put.status})`);
      }
      store.set("ondetv.sources", sources);
      store.set("ondetv.library.v2", library);
      syncState.last = Date.now();
      syncState.error = null;
      store.set("ondetv.syncLast", syncState.last);
      if (JSON.stringify(sources) !== before) {
        resetContent();
        if (!player.mode) { if (activeSources().length) renderShell(); else renderLogin(); }
      } else if (viewChanged && !player.mode && $("#sheet").classList.contains("hidden")) {
        // Groupes masqués / favoris modifiés sur un autre appareil : on rafraîchit l'écran
        // (sauf pendant la lecture ou si une fiche est ouverte, pour ne pas déranger).
        renderShell();
      }
    } catch (e) {
      syncState.error = e.message;
    } finally {
      syncState.running = null;
      document.dispatchEvent(new CustomEvent("syncstatus"));
    }
  })();
  return syncState.running;
}

function scheduleSync(delay = 3000) {
  if (!syncState.code) return;
  clearTimeout(syncState.timer);
  syncState.timer = setTimeout(() => syncNow(), delay);
}

async function enableSync() {
  syncState.code = newSyncCode();
  store.set("ondetv.syncCode", syncState.code);
  await syncNow();
  return syncState.code;
}

async function joinSync(code) {
  const c = normCode(code);
  if (c.length < 12) throw new Error("Code incomplet (16 caractères)");
  const id = await syncId(c);
  const res = await fetch(`/sync/${id}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  if (!body.blob) throw new Error("Aucune donnée pour ce code : activez d'abord la synchronisation sur l'autre appareil, puis ouvrez-y l'app");
  syncState.code = c;
  store.set("ondetv.syncCode", c);
  await syncNow({ join: true });
  if (syncState.error) throw new Error(syncState.error);
}

function disableSync() {
  syncState.code = null;
  store.del("ondetv.syncCode");
  document.dispatchEvent(new CustomEvent("syncstatus"));
}

function syncStatusText() {
  if (!syncState.code) return "Désactivée";
  if (syncState.running) return "Synchronisation…";
  if (syncState.error) return `Erreur : ${syncState.error}`;
  if (!syncState.last) return "En attente";
  const min = Math.round((Date.now() - syncState.last) / 60000);
  return min < 1 ? "À jour" : `À jour il y a ${min} min`;
}

document.addEventListener("visibilitychange", () => { if (!document.hidden) syncNow(); else if (syncState.code) syncNow(); });
setInterval(() => { if (!document.hidden) syncNow(); }, 120000);

// ---------------------------------------------------------------- mode télécommande (Android TV, Fire TV)
// Activé automatiquement dans l'app Android TV (OndeAndroid) ou avec ?tv=1 dans un navigateur de TV.

const Native = globalThis.OndeAndroid || null;
const TV_MODE = (() => {
  const q = new URLSearchParams(location.search).get("tv");
  if (q === "1") store.set("ondetv.tv", true);
  if (q === "0") store.del("ondetv.tv");
  return !!Native?.isTV?.() || store.get("ondetv.tv", false);
})();

if (TV_MODE) {
  document.body.classList.add("tv");
  if (!Native) for (const b of document.querySelectorAll('[data-act="vlc"], [data-vod="vlc"]')) b.remove();
}
if (Native) for (const b of document.querySelectorAll('[data-act="vlc"], [data-vod="vlc"]')) b.innerHTML = "<span>▶</span>Lecteur Android";

// Lecteur Android (ExoPlayer) pour les formats que le navigateur ne lit pas (MKV, AVI…).
function playNative(url, title, subtitle, progressKey) {
  const p = progressKey ? library.progress[progressKey] : null;
  const start = p && p.pos / p.dur < 0.95 ? p.pos : 0;
  nativeSession = { progressKey };
  Native.play(url, title || "", subtitle || "", Math.round(start * 1000));
}
let nativeSession = null;
globalThis.ondetvNativeDone = (posMs, durMs) => {
  const key = nativeSession?.progressKey;
  nativeSession = null;
  if (key && posMs > 10000 && durMs > 0) {
    library.progress[key] = { pos: posMs / 1000, dur: durMs / 1000, t: Date.now() };
    saveLibrary(2000);
    if (currentTab !== "live") renderShell();
  }
};

// --- navigation au pavé directionnel

const FOCUSABLE = 'button, a[href], input:not([type="range"]):not([type="hidden"]), select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

function visibleEl(el) {
  if (el.disabled || el.closest(".hidden, [aria-hidden='true']")) return false;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const st = getComputedStyle(el);
  return st.visibility !== "hidden" && st.pointerEvents !== "none";
}

/** Couche active : la plus haute ouverte (menu, pavé, panneaux, fiche, lecteur, app). */
function activeLayer() {
  for (const sel of ["#menu", "#numpad", "#guide-panel", "#channel-panel"]) {
    const el = $(sel);
    if (!el.classList.contains("hidden")) return el;
  }
  if (!$("#sheet").classList.contains("hidden")) return $("#sheet .sheet-panel");
  if (!player.el.classList.contains("hidden")) return player.el;
  return $("#app");
}

function focusables(layer) {
  return [...layer.querySelectorAll(FOCUSABLE)].filter((el) => el.id !== "tap-layer" && visibleEl(el));
}

function preferredFocus(layer, list) {
  const pref = ".p-channel.playing, .p-channel.focused, button.sel, .selected, .active, .current";
  const content = list.filter((el) => !el.closest(".tabbar"));
  if (layer.id === "app") return content.find((el) => el.matches(".cat-row.active")) || content.find((el) => !el.matches("input, select, textarea")) || list[0];
  for (const sel of pref.split(", ")) { const el = list.find((x) => x.matches(sel)); if (el) return el; }
  return list.find((el) => !el.matches("input, select, textarea")) || list[0];
}

function tvFocus(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function moveFocus(dir) {
  const layer = activeLayer();
  const list = focusables(layer);
  if (!list.length) return false;
  const cur = document.activeElement;
  if (!cur || !layer.contains(cur) || !list.includes(cur)) { tvFocus(preferredFocus(layer, list)); return true; }
  const a = cur.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2, by = b.top + b.height / 2;
    let main, cross, overlap;
    if (dir === "right") { main = b.left - a.right; cross = by - ay; overlap = b.bottom > a.top && b.top < a.bottom; if (bx <= ax + 1) continue; }
    else if (dir === "left") { main = a.left - b.right; cross = by - ay; overlap = b.bottom > a.top && b.top < a.bottom; if (bx >= ax - 1) continue; }
    else if (dir === "down") { main = b.top - a.bottom; cross = bx - ax; overlap = b.right > a.left && b.left < a.right; if (by <= ay + 1) continue; }
    else { main = a.top - b.bottom; cross = bx - ax; overlap = b.right > a.left && b.left < a.right; if (by >= ay - 1) continue; }
    const score = Math.max(main, 0) + (overlap ? 0 : Math.abs(cross) * 2 + 40);
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) tvFocus(best);
  return !!best;
}

const playerIdle = () => player.el.classList.contains("idle");
const focusInPlayerControls = () => {
  const a = document.activeElement;
  return a && a !== document.body && player.el.contains(a) && !anyOverlayOpen() && !playerIdle();
};

/** Bouton Retour de la télécommande. Renvoie false quand il n'y a plus rien à fermer (l'app propose alors de quitter). */
globalThis.ondetvBack = () => {
  if (anyOverlayOpen()) { closePanels(); wake(); return true; }
  if (!$("#sheet").classList.contains("hidden")) { closeSheet(); return true; }
  if (!player.el.classList.contains("hidden")) {
    if (!playerIdle() && player.mode && (focusInPlayerControls() || !video.paused)) { hideUI(); document.activeElement?.blur(); return true; }
    $("#player-close").click();
    return true;
  }
  if (currentTab !== "live") { currentTab = "live"; store.set("ondetv.tab", "live"); renderShell(); return true; }
  return false;
};

/** Touches spéciales transmises par l'app Android (chaîne +/-, lecture/pause, menu). */
globalThis.ondetvKey = (key) => {
  const live = player.mode === "live" && !player.el.classList.contains("hidden");
  if (key === "ChannelUp" && live) zapDirection(-1);
  else if (key === "ChannelDown" && live) zapDirection(1);
  else if (key === "PlayPause" && player.mode) togglePause();
  else if (key === "Menu" && player.mode) { player.mode === "live" ? openOptions() : openVodOptions(); }
  else return;
  wake();
};

if (TV_MODE) {
  document.addEventListener("keydown", (e) => {
    const dirs = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    const inPlayer = !player.el.classList.contains("hidden");
    if (e.key === "Escape" || e.key === "GoBack" || e.key === "BrowserBack") {
      if (!Native) { e.preventDefault(); e.stopImmediatePropagation(); globalThis.ondetvBack(); }
      return;
    }
    if (e.key === "MediaPlayPause" || e.key === "MediaPlay" || e.key === "MediaPause") { e.preventDefault(); globalThis.ondetvKey("PlayPause"); return; }
    if (e.key === "ChannelUp" || e.key === "ChannelDown") { e.preventDefault(); globalThis.ondetvKey(e.key); return; }
    if (e.key === "ContextMenu") { e.preventDefault(); globalThis.ondetvKey("Menu"); return; }

    // Lecteur sans menu ouvert : zapping, liste, guide, avance… (gérés par le lecteur) ; OK affiche les commandes.
    if (inPlayer && !anyOverlayOpen() && !focusInPlayerControls()) {
      if (e.key === "Enter") {
        e.preventDefault(); e.stopImmediatePropagation();
        wake(8000);
        const center = $("#center-play");
        if (visibleEl(center)) tvFocus(center);
        else { const list = focusables(player.el); tvFocus(list.find((el) => el.closest(".live-controls, .vod-controls, #vod-ui")) || list[0]); }
      }
      return; // les flèches restent au lecteur
    }
    const dir = dirs[e.key];
    if (dir) {
      const t = e.target;
      // Dans un champ de texte, gauche/droite déplacent le curseur tant qu'on n'est pas au bord.
      if (t.matches?.("input, textarea") && (dir === "left" || dir === "right")) {
        const atStart = t.selectionStart === 0 && t.selectionEnd === 0;
        const atEnd = t.selectionStart === t.value.length;
        if ((dir === "left" && !atStart) || (dir === "right" && !atEnd)) return;
      }
      if (t.matches?.("select")) return;
      e.preventDefault(); e.stopImmediatePropagation();
      moveFocus(dir);
      if (inPlayer) wake(8000);
      return;
    }
    if (e.key === "Enter" && inPlayer) {
      // OK sur un bouton : action ; on garde les commandes affichées.
      wake(8000);
      if (anyOverlayOpen() && document.activeElement && !activeLayer().contains(document.activeElement)) {
        e.preventDefault(); e.stopImmediatePropagation();
        moveFocus("down");
      }
      e.stopImmediatePropagation(); // ne pas ouvrir la liste des chaînes en plus du clic
    }
  }, true);

  // Les commandes disparaissent : le focus quitte le lecteur pour rendre les flèches au zapping.
  new MutationObserver(() => {
    const a = document.activeElement;
    if (playerIdle() && player.el.contains(a) && !anyOverlayOpen()) a.blur();
    // Lecteur ouvert : le focus ne reste pas sur la liste derrière.
    if (!player.el.classList.contains("hidden") && a && a !== document.body && !player.el.contains(a)) a.blur();
  }).observe(player.el, { attributes: true, attributeFilter: ["class"] });

  // Quand une couche s'ouvre (menu, liste, guide, fiche), on y place le focus.
  const layerObserver = new MutationObserver(() => {
    requestAnimationFrame(() => {
      const layer = activeLayer();
      if (layer === player.el || layer === $("#app")) return;
      if (layer.contains(document.activeElement)) return;
      const list = focusables(layer);
      if (list.length) tvFocus(preferredFocus(layer, list));
    });
  });
  for (const sel of ["#menu", "#numpad", "#guide-panel", "#channel-panel", "#sheet"]) layerObserver.observe($(sel), { attributes: true, attributeFilter: ["class"] });

  if (Native) {
    video.addEventListener("playing", () => Native.keepScreenOn(true));
    video.addEventListener("pause", () => Native.keepScreenOn(false));
    video.addEventListener("emptied", () => Native.keepScreenOn(false));
  }
}

// ---------------------------------------------------------------- démarrage

const handoff = readHandoff();
if (handoff?.sources?.length && !activeSources().length) {
  sources = handoff.sources;
  store.set("ondetv.sources", sources);
}
if (handoff?.code && !syncState.code) {
  joinSync(handoff.code).then(() => { if (activeSources().length) { renderShell(); resumeHandoff(); } }).catch((e) => toast(e.message));
}
function resumeHandoff() {
  if (!handoff) return;
  if (handoff.live) {
    loadLive().then(() => {
      const s = content.liveById.get(handoff.live);
      if (s) { playLive(s); toast("Touchez ⧉ pour l'image dans l'image"); }
    }).catch(() => {});
  } else if (handoff.vod) {
    const [url, title, subtitle, key] = handoff.vod;
    if (key && handoff.pos > 10) library.progress[key] = { pos: handoff.pos, dur: handoff.dur, t: Date.now() };
    playVOD(url, title, subtitle, key, { forceInternal: true });
    if (!key && handoff.pos > 10) video.addEventListener("loadedmetadata", () => { video.currentTime = handoff.pos; }, { once: true });
    toast("Touchez ⧉ pour l'image dans l'image");
  }
}

if (activeSources().length) {
  renderShell();
  syncNow();
  if (handoff && !(handoff.code && !syncState.code)) resumeHandoff();
  else if (handoff) { /* reprise après la synchronisation */ }
  else if (prefs.resumeLastChannel && library.lastChannel) {
    loadLive().then(() => {
      const s = content.liveById.get(library.lastChannel.id);
      if (s) playLive(s, channelsFor(library.lastChannel.groupId), library.lastChannel.groupId);
    }).catch(() => {});
  }
} else renderLogin();
