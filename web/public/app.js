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
function saveSources() { store.set("ondetv.sources", sources); }
const activeSources = () => sources.filter((x) => x.enabled !== false && x.password);
const sourceOf = (item) => sources.find((x) => x.id === (item.src ?? item));
const multiSource = () => activeSources().length > 1;
const sourceName = (item) => sourceOf(item)?.name || "";
function saveLibrary() { store.set("ondetv.library.v2", library); }
function toggle(list, id) {
  const i = library[list].indexOf(id);
  if (i >= 0) library[list].splice(i, 1); else library[list].push(id);
  saveLibrary();
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

function parseEPG(data) {
  return asList(data?.epg_listings).map((p) => ({
    id: String(p.id ?? p.start_timestamp),
    title: b64(p.title) || "Sans titre",
    description: b64(p.description),
    start: new Date(num(p.start_timestamp) * 1000),
    end: new Date(num(p.stop_timestamp ?? p.end_timestamp) * 1000),
    archive: Number(p.has_archive) === 1,
  })).filter((p) => !isNaN(p.start) && !isNaN(p.end)).sort((a, b) => a.start - b.start);
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
          name: String(x.name ?? "").trim() || `Chaîne ${x.stream_id}`, icon: x.stream_icon, cat: `${src.id}:${x.category_id ?? ""}`,
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
      .then((d) => { content.epg.set(id, parseEPG(d)); document.dispatchEvent(new CustomEvent("epg", { detail: id })); })
      .catch(() => content.epg.set(id, []))
      .finally(() => { epgRunning--; content.epgPending.delete(id); pumpEPG(); });
  }
}
const nowProgram = (id, t = new Date()) => content.epg.get(id)?.find((p) => p.start <= t && t < p.end);
const nextProgram = (id, t = new Date()) => content.epg.get(id)?.find((p) => p.start > t);
const progress = (p, t = new Date()) => Math.min(100, Math.max(0, ((t - p.start) / (p.end - p.start)) * 100));

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
  app.replaceChildren(h("div", { class: "login" }, form));
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

function channelsFor(cat) {
  if (cat === "__fav") return library.favChannels.map((id) => content.liveById.get(id)).filter(Boolean);
  if (cat === "__recent") return library.recents.map((id) => content.liveById.get(id)).filter(Boolean);
  if (cat === "__all") return content.live;
  if (cat === "__replay") return content.live.filter((x) => x.archive);
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
    h("option", { value: "__replay" }, `⟲ Chaînes avec replay (${content.live.filter((x) => x.archive).length})`),
    h("option", { value: "__all" }, `Toutes les chaînes (${content.live.length})`),
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
    let list = q ? content.live.filter((s) => s.name.toLowerCase().includes(q) || String(s.num) === q) : channelsFor(liveCategory);
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
    stopChunks = renderChunked(main, list, (s) => {
      const row = h("div", { class: "channel", "data-id": s.id },
        h("span", { class: "num" }, s.num ?? ""),
        logoBox(s),
        h("button", { class: "info", style: { textAlign: "left" }, onclick: () => playLive(s, list, liveCategory) },
          h("div", { class: "name" }, s.name, library.favChannels.includes(s.id) ? h("span", { class: "star" }, " ★") : null, s.archive ? h("span", { class: "muted" }, " ⟲") : null),
          multiSource() ? h("div", { class: "src-tag" }, sourceName(s)) : null,
          h("div", { class: "now" }), h("div", { class: "bar hidden" }, h("i"))),
        h("button", { class: "info-btn", "aria-label": "Programme", onclick: () => openChannel(s, list) }, "ⓘ"));
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

    const programs0 = await fullEPG(stream);
    let programs = programs0;
    const now = new Date();
    const horizon = now - (stream.archiveDays * 86400000 + 3600000);
    programs = programs.filter((p) => p.end > horizon);
    if (!programs.length) { epgBox.replaceChildren(h("div", { class: "empty" }, "Aucun programme disponible.")); return; }

    epgBox.replaceChildren();
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
  id: `${src.id}:${m.stream_id}`, sid: num(m.stream_id), src: src.id, name: String(m.name ?? "").trim(), icon: m.stream_icon,
  rating: num(m.rating) || null, ext: m.container_extension || "mp4", added: num(m.added) || 0,
}), "added");

const fetchSeries = (cat) => fetchCatalog(content.series, cat, "get_series", (x, src) => num(x.series_id) === null ? null : ({
  id: `${src.id}:${x.series_id}`, sid: num(x.series_id), src: src.id, name: String(x.name ?? "").trim(), icon: x.cover,
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
  const chipsDef = [{ id: "__fav", name: "★ Favoris" }, ...(isMovies ? [{ id: "__resume", name: "Reprendre" }] : []), { id: "__all", name: "Tout" },
    ...cats.map((c) => ({ id: c.id, name: multiSource() ? `${sourceName(c)} · ${c.name}` : c.name }))];
  const chips = h("div", { class: "chips" });
  let searchTimer = null;
  const search = h("input", { type: "search", placeholder: isMovies ? "Rechercher un film" : "Rechercher une série", oninput: () => { clearTimeout(searchTimer); searchTimer = setTimeout(draw, 250); } });
  top.append(chips, h("div", { class: "row" }, search));

  const drawChips = () => chips.replaceChildren(...chipsDef.map((c) => h("button", {
    class: `chip${c.id === selected ? " active" : ""}`,
    onclick: () => { selected = c.id; if (isMovies) { vodCategory = c.id; store.set("ondetv.vodCat", c.id); } else { seriesCategory = c.id; store.set("ondetv.seriesCat", c.id); } drawChips(); load(); },
  }, c.name)));
  drawChips();
  chips.querySelector(".active")?.scrollIntoView({ inline: "center", block: "nearest" });

  let items = [];
  let stopChunks = null;
  cleanup = () => stopChunks?.();

  async function load() {
    main.replaceChildren(h("div", { class: "loading" }, "Chargement…"));
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
      }
      draw();
    } catch (e) { failure(main, e, load); }
  }

  let searchToken = 0;
  async function draw() {
    stopChunks?.();
    const q = search.value.trim().toLowerCase();
    let list = items;
    if (q) {
      // Comme TiviMate : la recherche porte sur tout le catalogue, toutes sources confondues.
      const token = ++searchToken;
      main.replaceChildren(h("div", { class: "loading" }, "Recherche dans toutes les sources…"));
      const all = await (isMovies ? fetchVOD : fetchSeries)("__all").catch(() => items);
      if (token !== searchToken) return;
      list = all.filter((x) => x.name.toLowerCase().includes(q));
    }
    main.replaceChildren();
    main.scrollTop = 0;
    if (!list.length) { main.append(h("div", { class: "empty" }, q ? "Aucun résultat." : "Rien à afficher.")); return; }
    if (q) main.append(h("div", { class: "section-label" }, `${list.length} résultat${list.length > 1 ? "s" : ""}${multiSource() ? " · toutes sources" : ""}`));
    const grid = h("div", { class: "grid" });
    main.append(grid);
    stopChunks = renderChunked(grid, list, (x) => isMovies
      ? poster(x, () => openMovie(x), progressFraction(`movie-${x.id}`))
      : poster(x, () => openSeries(x)), main, 90);
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
          resume ? h("button", { class: "btn", onclick: () => { delete library.progress[key]; saveLibrary(); closeSheet(); playVOD(urls.movie(movie, ext), movie.name, null, key); } }, "⟲") : null,
          favBtn),
        !nativeFormat(ext) ? h("p", { class: "error" }, `Format ${ext.toUpperCase()} : peut ne pas être lisible dans le navigateur.`) : null,
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
          h("div", { style: { minWidth: 0 } },
            h("div", { class: "t" }, `${e.num}. ${e.title}`, f >= 0.95 ? " ✓" : ""),
            e.duration ? h("div", { class: "d" }, durationText(e.duration)) : null,
            e.plot ? h("div", { class: "d" }, e.plot) : null));
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
      } }, h("span", {}, "Actualiser chaînes et catalogue"), h("span", {}, "↻"))),
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
async function fullEPG(stream) {
  const acc = sourceOf(stream);
  let programs = parseEPG(await api("get_simple_data_table", { stream_id: stream.sid }, acc).catch(() => null));
  if (!programs.length) programs = parseEPG(await api("get_short_epg", { stream_id: stream.sid, limit: 20 }, acc).catch(() => null));
  return programs;
}

// ---------------------------------------------------------------- préférences

const PREF_DEFAULTS = {
  tapOpensList: false,     // toucher la vidéo : ouvre la liste des chaînes (sinon affiche les commandes)
  invertZap: false,        // inverser le sens du zapping (glisser / flèches)
  swipeZap: true,          // zapper en glissant vers le haut / le bas
  bannerOnZap: true,       // bandeau d'infos à chaque changement de chaîne
  closeListOnSelect: true, // fermer la liste après avoir choisi une chaîne
  resumeLastChannel: false,// relancer la dernière chaîne à l'ouverture de l'app
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

async function startVideo(url, startAt = 0) {
  player.hls?.destroy();
  player.hls = null;
  status("Chargement…");
  const src = proxy(url);
  if (/\.m3u8(\?|$)/i.test(url) && !canNativeHLS()) {
    try {
      const Hls = await loadHlsJs();
      player.hls = new Hls();
      player.hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) onVideoError(); });
      player.hls.loadSource(src);
      player.hls.attachMedia(video);
    } catch (e) { status(e.message); return; }
  } else {
    video.src = src;
  }
  video.onloadedmetadata = () => {
    if (startAt <= 0) return;
    const end = Number.isFinite(video.duration) ? video.duration : (video.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0);
    if (end > startAt) video.currentTime = startAt;
  };
  video.play().catch(() => status("Touchez ▶ pour lancer la lecture.", [h("button", { class: "btn primary", onclick: () => video.play() }, "▶ Lecture")]));
}

video.addEventListener("playing", () => { status(""); updatePauseButton(); });
video.addEventListener("pause", updatePauseButton);
video.addEventListener("waiting", () => status("Chargement…"));
video.addEventListener("error", () => { if (player.mode) onVideoError(); });

function onVideoError() {
  const actions = [h("button", { class: "btn primary", onclick: retry }, "Réessayer")];
  if (player.mode === "live") actions.push(h("button", { class: "btn", style: { marginLeft: "8px" }, onclick: () => zap(1) }, "Chaîne suivante"));
  status(player.mode === "live" ? "Chaîne indisponible pour le moment." : "Lecture impossible (format non pris en charge par le navigateur ou flux indisponible).", actions);
}
function retry() {
  if (player.mode === "live") { if (player.shift) shiftTo(watchedTime()); else playLive(player.stream); }
  else if (player.lastVOD) playVOD(...player.lastVOD);
}

function openPlayer(mode, title, subtitle) {
  player.mode = mode;
  player.el.classList.toggle("vod", mode === "vod");
  video.controls = mode === "vod";
  $("#tap-layer").classList.toggle("hidden", mode === "vod");
  $("#live-ui").classList.toggle("hidden", mode !== "live");
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
  player.minimized = false;
  if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
  player.el.classList.remove("rotated");
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
  const b = $("#btn-pause");
  b.innerHTML = video.paused ? "<span>▶</span>Lecture" : "<span>⏸</span>Pause";
}

function applyAspect() {
  const a = player.mode === "live" ? player.aspect : "contain";
  video.style.objectFit = a === "zoom" ? "cover" : a;
  video.style.transform = a === "zoom" ? "scale(1.18)" : "";
  $("#btn-aspect").innerHTML = `<span>⤢</span>${ASPECTS.find((x) => x.id === player.aspect)?.label || "Ajusté"}`;
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
  fullEPGCache.set(stream.id, { at: Date.now(), programs });
  if (player.stream?.id === stream.id) { updateLiveEPG(); updateShiftUI(); }
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
  $("#btn-forward").classList.toggle("hidden", !shifted && !isBehindLocal());
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

// ---------------------------------------------------------------- plein écran (avec les boutons d'OndeTV)

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
const isFullscreen = () => !!fsElement() || player.el.classList.contains("rotated");

async function toggleFullscreen() {
  if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen)?.call(document); return; }
  if (player.el.classList.contains("rotated")) { setRotated(false); return; }
  // iPad / ordinateur : vrai plein écran de tout le lecteur (vidéo + boutons).
  const el = player.el;
  const request = el.requestFullscreen || el.webkitRequestFullscreen;
  if (request && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) {
    try {
      await request.call(el);
      screen.orientation?.lock?.("landscape").catch(() => {});
      return;
    } catch { /* on passe au mode paysage simulé */ }
  }
  // iPhone : Safari n'autorise le plein écran que pour son propre lecteur → paysage simulé.
  if (innerHeight > innerWidth) setRotated(true);
  else toast("Astuce : ajoutez OndeTV à l'écran d'accueil pour masquer les barres de Safari");
}

function setRotated(on) {
  player.el.classList.toggle("rotated", on);
  updateFullscreenButton();
  wake();
}

function updateFullscreenButton() {
  $("#btn-fs").innerHTML = isFullscreen() ? "<span>⛶</span>Quitter" : "<span>⛶</span>Plein écran";
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

async function togglePiP() {
  if (isPiP()) {
    if (document.pictureInPictureElement) await document.exitPictureInPicture().catch(() => {});
    else video.webkitSetPresentationMode("inline");
    return;
  }
  try {
    if (video.paused) await video.play().catch(() => {});
    if (video.webkitSupportsPresentationMode?.("picture-in-picture")) video.webkitSetPresentationMode("picture-in-picture");
    else if (video.requestPictureInPicture) await video.requestPictureInPicture();
    else throw new Error("non pris en charge");
    // L'animation d'iOS prend un moment : on attend jusqu'à 2,5 s avant de conclure.
    if (!(await waitFor(isPiP, 2500))) throw new Error("refusé");
  } catch {
    toast("iOS n'a pas ouvert le PiP · essayez Options → Lecteur iOS natif");
  }
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

  // Comme TiviMate : les groupes de toutes les sources dans une seule liste, séparés par source.
  const groups = [
    { id: "__recent", name: "🕘 Récents" },
    { id: "__fav", name: "★ Favoris" },
    { id: "__replay", name: "⟲ Chaînes avec replay" },
    ...activeSources().filter((src) => inPanelSource({ src: src.id })).flatMap((src) => [
      ...(multiSource() && panel.source === "__all" ? [{ label: src.name }] : []),
      ...content.liveCats.filter((c) => c.src === src.id).map((c) => ({ id: c.id, name: c.name })),
    ]),
    ...(multiSource() && panel.source === "__all" ? [{ label: "Toutes les sources" }] : []),
    { id: "__all", name: panel.source === "__all" ? "Toutes les chaînes" : `Toutes les chaînes · ${sourceName(panel.source)}` },
  ];
  for (const g of groups) {
    if (g.label) { list.append(h("div", { class: "source-label" }, g.label)); continue; }
    const channels = groupList(g.id).filter(inPanelSource);
    if (!channels.length && g.id !== "__fav") continue;
    const open = panel.expanded.has(g.id);
    const head = h("button", {
      class: `group-head${open ? " open" : ""}${g.id === player.groupId ? " current" : ""}`,
      onclick: () => { if (open) panel.expanded.delete(g.id); else panel.expanded.add(g.id); const top = head.offsetTop; drawPanel(); restoreGroup(g.id, top); },
    }, h("span", { class: "chev" }, "›"), g.name, h("span", { class: "count" }, channels.length));
    head.dataset.group = g.id;
    list.append(head);
    if (open) {
      if (!channels.length) list.append(h("div", { class: "empty", style: { padding: "16px" } }, "Touchez ☆ à côté d'une chaîne pour l'ajouter."));
      const box = h("div");
      list.append(box);
      renderChunked(box, channels, (s) => panelRow(s, channels, g.id), list, 80);
    }
  }
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
      groupId === "__all" || groupId === "__fav" || groupId === "__recent" ? (multiSource() ? h("div", { class: "src-tag" }, sourceName(s)) : null) : null),
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
  const now = new Date();
  const programs = all.filter((p) => p.end > now - (stream.archiveDays * 86400000 + 3600000));
  list.replaceChildren(h("div", { class: "guide-note" }, stream.archive
    ? `Replay disponible sur ${stream.archiveDays} jour${stream.archiveDays > 1 ? "s" : ""} : touchez un programme passé (▶) pour le revoir, ou le programme en cours pour le reprendre au début.`
    : "Cette chaîne ne propose pas de replay chez votre fournisseur. Les chaînes avec replay sont marquées ⟲ (catégorie « Chaînes avec replay »)."));
  if (!programs.length) { list.append(h("div", { class: "empty" }, "Aucun programme disponible.")); return; }

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
    { label: "Format d'image", value: ASPECTS.find((a) => a.id === player.aspect).label, action: openAspectMenu },
    { label: "Minuterie de mise en veille", value: sleepLeft, action: () => openMenu("Mise en veille", [0, 15, 30, 60, 90, 120].map((m) => ({
      label: m ? `${m} minutes` : "Désactivée", selected: m === 0 && !player.sleepAt, action: () => setSleep(m),
    }))) },
    stream ? { label: library.favChannels.includes(stream.id) ? "Retirer des favoris" : "Ajouter aux favoris", action: toggleCurrentFav } : null,
    { label: "Image dans l'image (PiP)", action: togglePiP },
    { label: isFullscreen() ? "Quitter le plein écran" : "Plein écran", action: toggleFullscreen },
    { label: "Lecteur iOS natif (PiP, AirPlay)", action: () => video.webkitEnterFullscreen ? video.webkitEnterFullscreen() : video.requestFullscreen?.() },
    { label: "Recharger la chaîne", action: retry },
    { label: "Informations du flux", action: () => toast(video.videoWidth ? `${video.videoWidth}×${video.videoHeight}${player.hls ? " · hls.js" : " · HLS natif"}` : "Flux non chargé") },
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
  ["swipeZap", "Zapper en glissant haut / bas"],
  ["invertZap", "Inverser le sens du zapping"],
  ["bannerOnZap", "Bandeau d'infos au changement de chaîne"],
  ["closeListOnSelect", "Fermer la liste après sélection"],
  ["resumeLastChannel", "Relancer la dernière chaîne au démarrage"],
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

function playVOD(url, title, subtitle, progressKey) {
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
  saveLibrary();
}

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
    fullscreen: toggleFullscreen,
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
  if (now - lastTap < 300) { clearTimeout(singleTapTimer); lastTap = 0; goPrevious(); return; }
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
  } else if (e.key === "f" || e.key === "F") {
    toggleFullscreen();
  } else if (e.key === " ") {
    togglePause();
  } else return;
  e.preventDefault();
  wake();
});
document.addEventListener("visibilitychange", () => { if (document.hidden) saveVODProgress(); });

// ---------------------------------------------------------------- démarrage

if (activeSources().length) {
  renderShell();
  if (prefs.resumeLastChannel && library.lastChannel) {
    loadLive().then(() => {
      const s = content.liveById.get(library.lastChannel.id);
      if (s) playLive(s, channelsFor(library.lastChannel.groupId), library.lastChannel.groupId);
    }).catch(() => {});
  }
} else renderLogin();
