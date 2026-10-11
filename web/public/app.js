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

let account = store.get("ondetv.account", null);
const libKey = () => `ondetv.library.${account?.server}|${account?.username}`;
let library = loadLibrary();

function loadLibrary() {
  const l = account ? store.get(libKey(), {}) : {};
  return { favChannels: [], favMovies: [], favSeries: [], recents: [], progress: {}, ...l };
}
function saveLibrary() { store.set(libKey(), library); }
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

async function api(action, params = {}, acc = account) {
  const u = new URL(`${acc.server}/player_api.php`);
  u.searchParams.set("username", acc.username);
  u.searchParams.set("password", acc.password);
  if (action) u.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const res = await fetch(proxy(u.href));
  if (!res.ok) throw new Error(res.status === 502 ? "Serveur injoignable." : `Erreur serveur (HTTP ${res.status}).`);
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error("Réponse illisible : vérifiez l'adresse du serveur (http/https, port)."); }
}

const asList = (v) => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : []);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const enc = encodeURIComponent;
const userPath = () => `${enc(account.username)}/${enc(account.password)}`;

const urls = {
  live: (id) => `${account.server}/live/${userPath()}/${id}.m3u8`,
  movie: (id, ext) => `${account.server}/movie/${userPath()}/${id}.${ext || "mp4"}`,
  episode: (id, ext) => `${account.server}/series/${userPath()}/${id}.${ext || "mp4"}`,
  catchup(streamId, program) {
    const tz = account.timezone || undefined;
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(program.start).map((p) => [p.type, p.value]));
    const start = `${parts.year}-${parts.month}-${parts.day}:${parts.hour}-${parts.minute}`;
    const minutes = Math.max(1, Math.ceil((program.end - program.start) / 60000));
    return `${account.server}/timeshift/${userPath()}/${minutes}/${start}/${streamId}.m3u8`;
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

async function loadLive(force = false) {
  if (content.live && !force) return;
  const [cats, streams] = await Promise.all([api("get_live_categories"), api("get_live_streams")]);
  content.liveCats = asList(cats).map((c) => ({ id: String(c.category_id), name: c.category_name || "Sans nom" }));
  content.live = asList(streams).filter((s) => num(s.stream_id) !== null).map((s) => ({
    id: num(s.stream_id), num: num(s.num), name: String(s.name ?? "").trim() || `Chaîne ${s.stream_id}`,
    icon: s.stream_icon, cat: String(s.category_id ?? ""),
    archive: Number(s.tv_archive) === 1 && num(s.tv_archive_duration) > 0, archiveDays: num(s.tv_archive_duration) || 0,
  })).sort((a, b) => (a.num ?? 1e9) - (b.num ?? 1e9) || a.name.localeCompare(b.name));
  content.liveById = new Map(content.live.map((s) => [s.id, s]));
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
    api("get_short_epg", { stream_id: id, limit: 6 })
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
  const server = h("input", { class: "field", placeholder: "http://serveur.com:8080", inputmode: "url", autocapitalize: "off", autocorrect: "off", value: account?.server || "" });
  const user = h("input", { class: "field", placeholder: "Nom d'utilisateur", autocapitalize: "off", autocorrect: "off", value: account?.username || "" });
  const pass = h("input", { class: "field", placeholder: "Mot de passe", type: "password", autocomplete: "current-password" });
  const err = h("div", { class: "error" }, error);
  const submit = h("button", { class: "btn primary", type: "submit" }, "Se connecter");

  const form = h("form", {
    async onsubmit(e) {
      e.preventDefault();
      err.textContent = "";
      submit.disabled = true;
      submit.textContent = "Connexion…";
      try {
        const acc = { server: normalizeServer(server.value), username: user.value.trim(), password: pass.value.trim() };
        if (!acc.username || !acc.password) throw new Error("Nom d'utilisateur et mot de passe requis.");
        const auth = await api(null, {}, acc);
        const info = auth?.user_info;
        if (!info || Number(info.auth) !== 1) throw new Error(info?.message || "Identifiants refusés par le serveur.");
        if (info.status && info.status.toLowerCase() !== "active") throw new Error(`Abonnement non actif (statut : ${info.status}).`);
        acc.timezone = auth.server_info?.timezone || null;
        acc.info = info;
        account = acc;
        store.set("ondetv.account", account);
        library = loadLibrary();
        renderShell();
      } catch (e2) {
        err.textContent = e2.message;
      } finally {
        submit.disabled = false;
        submit.textContent = "Se connecter";
      }
    },
  },
    h("div", { class: "logo" }, h("img", { src: "icon-192.png", alt: "" }), h("h1", {}, "OndeTV"),
      h("div", { class: "muted" }, "Connectez votre abonnement Xtream Codes")),
    server, user, pass, err, submit,
    h("p", { class: "muted", style: { fontSize: "13px", textAlign: "center" } },
      "Astuce : Partager → « Sur l'écran d'accueil » pour l'utiliser comme une app."));

  app.replaceChildren(h("div", { class: "login" }, form));
}

// ---------------------------------------------------------------- structure à onglets

const TABS = [
  { id: "live", label: "Direct", icon: "📺", render: renderLive },
  { id: "movies", label: "Films", icon: "🎬", render: renderMovies },
  { id: "series", label: "Séries", icon: "🎞️", render: renderSeries },
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
  return content.live.filter((s) => s.cat === cat);
}

async function renderLive(top, main) {
  top.append(h("h2", {}, "Direct"));
  main.replaceChildren(h("div", { class: "loading" }, "Chargement des chaînes…"));
  try { await loadLive(); } catch (e) { return failure(main, e, () => renderShell()); }

  const select = h("select", { onchange: () => { liveCategory = select.value; store.set("ondetv.liveCat", liveCategory); draw(); } },
    h("option", { value: "__fav" }, `★ Favoris (${library.favChannels.length})`),
    h("option", { value: "__recent" }, "Récents"),
    h("option", { value: "__all" }, `Toutes les chaînes (${content.live.length})`),
    content.liveCats.map((c) => h("option", { value: c.id }, c.name)));
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
    for (const e of entries) if (e.isIntersecting) { requestEPG(Number(e.target.dataset.id)); io.unobserve(e.target); }
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
    let list = channelsFor(liveCategory);
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q));
    main.replaceChildren();
    main.scrollTop = 0;
    if (!list.length) {
      main.append(h("div", { class: "empty" }, q ? "Aucun résultat." : liveCategory === "__fav" ? "Aucun favori. Ouvrez une chaîne (ⓘ) pour l'ajouter." : "Aucune chaîne."));
      return;
    }
    stopChunks = renderChunked(main, list, (s) => {
      const row = h("div", { class: "channel", "data-id": s.id },
        h("span", { class: "num" }, s.num ?? ""),
        logoBox(s),
        h("button", { class: "info", style: { textAlign: "left" }, onclick: () => playLive(s, list) },
          h("div", { class: "name" }, s.name, library.favChannels.includes(s.id) ? h("span", { class: "star" }, " ★") : null, s.archive ? h("span", { class: "muted" }, " ⟲") : null),
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
          [stream.num ? `N° ${stream.num}` : null, stream.archive ? `Replay ${stream.archiveDays} j` : null].filter(Boolean).join(" · ")))),
      h("div", { class: "actions" }, h("button", { class: "btn primary", onclick: () => { closeSheet(); playLive(stream, list); } }, "▶ Regarder"), favBtn));
    const epgBox = h("div", { class: "detail", style: { marginTop: 0 } }, h("div", { class: "loading" }, "Programme…"));
    target.replaceChildren(header, epgBox);

    let programs = parseEPG(await api("get_simple_data_table", { stream_id: stream.id }).catch(() => null));
    if (!programs.length) programs = parseEPG(await api("get_short_epg", { stream_id: stream.id, limit: 20 }).catch(() => null));
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
          if (live) { closeSheet(); playLive(stream, list); }
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

async function fetchVOD(cat) {
  if (!content.vod.has(cat)) {
    const data = await api("get_vod_streams", cat === "__all" ? {} : { category_id: cat });
    content.vod.set(cat, asList(data).filter((m) => num(m.stream_id) !== null).map((m) => ({
      id: num(m.stream_id), name: String(m.name ?? "").trim(), icon: m.stream_icon, rating: num(m.rating) || null,
      ext: m.container_extension || "mp4", added: num(m.added) || 0,
    })).sort((a, b) => b.added - a.added));
  }
  return content.vod.get(cat);
}

async function fetchSeries(cat) {
  if (!content.series.has(cat)) {
    const data = await api("get_series", cat === "__all" ? {} : { category_id: cat });
    content.series.set(cat, asList(data).filter((s) => num(s.series_id) !== null).map((s) => ({
      id: num(s.series_id), name: String(s.name ?? "").trim(), icon: s.cover, rating: num(s.rating) || null,
      plot: s.plot, genre: s.genre, cast: s.cast, year: (s.releaseDate || s.release_date || "").slice(0, 4),
      backdrop: Array.isArray(s.backdrop_path) ? s.backdrop_path[0] : s.backdrop_path, modified: num(s.last_modified) || 0,
    })).sort((a, b) => b.modified - a.modified));
  }
  return content.series.get(cat);
}

function poster(item, onclick, progressFraction) {
  const img = h("div", { class: "img" });
  const src = image(item.icon);
  if (src) img.style.backgroundImage = `url("${src}")`;
  if (item.rating) img.append(h("span", { class: "rating" }, `★ ${item.rating.toFixed(1)}`));
  if (progressFraction) img.append(h("div", { class: "bar" }, h("i", { style: { width: `${progressFraction * 100}%` } })));
  return h("button", { class: "poster", onclick }, img, h("div", { class: "title" }, item.name));
}

async function renderCatalog(top, main, kind) {
  const isMovies = kind === "movies";
  top.append(h("h2", {}, isMovies ? "Films" : "Séries"));
  main.replaceChildren(h("div", { class: "loading" }, "Chargement…"));
  let cats;
  try {
    if (isMovies) content.vodCats ??= asList(await api("get_vod_categories")).map((c) => ({ id: String(c.category_id), name: c.category_name }));
    else content.seriesCats ??= asList(await api("get_series_categories")).map((c) => ({ id: String(c.category_id), name: c.category_name }));
    cats = isMovies ? content.vodCats : content.seriesCats;
  } catch (e) { return failure(main, e, () => renderShell()); }

  let selected = isMovies ? vodCategory : seriesCategory;
  const chipsDef = [{ id: "__fav", name: "★ Favoris" }, ...(isMovies ? [{ id: "__resume", name: "Reprendre" }] : []), { id: "__all", name: "Tout" }, ...cats];
  const chips = h("div", { class: "chips" });
  const search = h("input", { type: "search", placeholder: isMovies ? "Rechercher un film" : "Rechercher une série", oninput: () => draw() });
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
          .sort((a, b) => b[1].t - a[1].t).map(([k]) => Number(k.slice(6)));
        items = ids.map((id) => byId.get(id)).filter(Boolean);
      } else {
        items = await fetcher(selected);
      }
      draw();
    } catch (e) { failure(main, e, load); }
  }

  function draw() {
    stopChunks?.();
    const q = search.value.trim().toLowerCase();
    const list = q ? items.filter((x) => x.name.toLowerCase().includes(q)) : items;
    main.replaceChildren();
    main.scrollTop = 0;
    if (!list.length) { main.append(h("div", { class: "empty" }, q ? "Aucun résultat." : "Rien à afficher.")); return; }
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
    const data = await api("get_vod_info", { vod_id: movie.id }).catch(() => ({}));
    const info = data && !Array.isArray(data.info) ? data.info || {} : {};
    const ext = data?.movie_data?.container_extension || movie.ext;
    const key = `movie-${movie.id}`;
    const facts = [(info.releasedate || "").slice(0, 4), num(info.duration_secs) ? durationText(num(info.duration_secs)) : null,
      movie.rating ? `★ ${movie.rating.toFixed(1)}` : null, ext.toUpperCase()].filter(Boolean).join(" · ");
    const resume = progressFraction(key) > 0 && progressFraction(key) < 0.95;
    const fav = () => library.favMovies.includes(movie.id);
    const favBtn = h("button", { class: "btn", onclick: () => { toggle("favMovies", movie.id); favBtn.textContent = fav() ? "★" : "☆"; } }, fav() ? "★" : "☆");
    const backdrop = Array.isArray(info.backdrop_path) ? info.backdrop_path[0] : info.backdrop_path;
    target.replaceChildren(
      hero(backdrop || info.movie_image || movie.icon),
      h("div", { class: "detail" },
        h("h3", {}, movie.name), h("div", { class: "facts" }, facts),
        h("div", { class: "actions" },
          h("button", { class: "btn primary", onclick: () => { closeSheet(); playVOD(urls.movie(movie.id, ext), movie.name, null, key); } }, resume ? "▶ Reprendre" : "▶ Lecture"),
          resume ? h("button", { class: "btn", onclick: () => { delete library.progress[key]; saveLibrary(); closeSheet(); playVOD(urls.movie(movie.id, ext), movie.name, null, key); } }, "⟲") : null,
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
    const data = await api("get_series_info", { series_id: series.id });
    const bySeason = new Map();
    const addEp = (e, seasonKey) => {
      const s = num(e.season) ?? num(seasonKey) ?? 0;
      if (!bySeason.has(s)) bySeason.set(s, []);
      bySeason.get(s).push({
        id: String(e.id), num: num(e.episode_num) ?? 0, season: s, title: e.title || `Épisode ${e.episode_num}`,
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
        return h("button", { class: "episode", onclick: () => { closeSheet(); playVOD(urls.episode(e.id, e.ext), e.title, `${series.name} · S${e.season} E${e.num}`, key); } },
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
        h("div", { class: "facts" }, [series.year, `${seasons.length} saison${seasons.length > 1 ? "s" : ""}`, series.rating ? `★ ${series.rating.toFixed(1)}` : null].filter(Boolean).join(" · ")),
        h("div", { class: "actions" }, favBtn),
        (info.plot || series.plot) ? h("p", {}, info.plot || series.plot) : null,
        seasons.length ? [seasonSelect, list] : h("div", { class: "empty" }, "Aucun épisode disponible.")));
    if (seasons.length) drawEpisodes();
  });
}

// ---------------------------------------------------------------- Réglages

function renderSettings(top, main) {
  top.append(h("h2", {}, "Réglages"));
  const info = account.info || {};
  const exp = num(info.exp_date) ? new Date(num(info.exp_date) * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Illimité";
  main.append(
    h("div", { class: "list" },
      item("Serveur", account.server), item("Utilisateur", account.username),
      item("Statut", info.status || "—"), item("Expiration", exp),
      num(info.max_connections) ? item("Connexions", `${info.active_cons ?? 0} / ${info.max_connections}`) : null),
    h("div", { class: "list" },
      h("button", { class: "item", style: { width: "100%" }, onclick: async () => {
        content.live = null; content.vod.clear(); content.series.clear(); content.epg.clear(); content.vodCats = content.seriesCats = null;
        try { const a = await api(null); account.info = a.user_info; store.set("ondetv.account", account); } catch {}
        renderShell();
      } }, h("span", {}, "Actualiser chaînes et catalogue"), h("span", {}, "↻")),
      h("button", { class: "item", style: { width: "100%", color: "var(--live)" }, onclick: () => {
        if (!confirm("Se déconnecter ?")) return;
        store.del("ondetv.account");
        account = { server: account.server, username: account.username };
        renderLogin();
      } }, h("span", {}, "Se déconnecter"), h("span", {}, ""))),
    h("p", { class: "note" }, "Version web d'OndeTV. Le direct, le replay et les films MP4 se lisent dans Safari ; les fichiers MKV/AVI ne sont pas pris en charge par le navigateur."),
    h("p", { class: "note" }, "Installer : bouton Partager de Safari → « Sur l'écran d'accueil »."),
    h("p", { class: "note" }, "OndeTV est un lecteur : il ne fournit aucun contenu. Utilisez uniquement des abonnements légaux."));

  function item(label, value) { return h("div", { class: "item" }, h("span", {}, label), h("span", {}, value)); }
}

// ---------------------------------------------------------------- lecteur

const player = {
  el: $("#player"), video: $("#video"), hls: null, mode: null, stream: null, playlist: [], progressKey: null, idleTimer: null, saveTimer: null,
};
const nativeFormat = (ext) => ["mp4", "m4v", "mov", "m3u8"].includes(String(ext).toLowerCase());
const canNativeHLS = () => player.video.canPlayType("application/vnd.apple.mpegurl") !== "";

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

async function startVideo(url, startAt = 0) {
  const v = player.video;
  player.hls?.destroy();
  player.hls = null;
  status("Chargement…");
  const src = proxy(url);
  const isHLS = /\.m3u8(\?|$)/i.test(url);
  if (isHLS && !canNativeHLS()) {
    try {
      const Hls = await loadHlsJs();
      player.hls = new Hls({ lowLatencyMode: false });
      player.hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) onVideoError(); });
      player.hls.loadSource(src);
      player.hls.attachMedia(v);
    } catch (e) { status(e.message); return; }
  } else {
    v.src = src;
  }
  v.onloadedmetadata = () => { if (startAt > 0 && Number.isFinite(v.duration)) v.currentTime = startAt; };
  v.play().catch(() => status("Touchez ▶ pour lancer la lecture."));
}

player.video.addEventListener("playing", () => status(""));
player.video.addEventListener("waiting", () => status("Chargement…"));
player.video.addEventListener("error", () => onVideoError());

function onVideoError() {
  const actions = [h("button", { class: "btn primary", onclick: () => retry() }, "Réessayer")];
  if (player.mode === "live") actions.push(h("button", { class: "btn", style: { marginLeft: "8px" }, onclick: () => zap(1) }, "Chaîne suivante"));
  status(player.mode === "live" ? "Chaîne indisponible pour le moment." : "Lecture impossible (format non pris en charge par le navigateur ou flux indisponible).", actions);
}
function retry() { if (player.mode === "live") playLive(player.stream, player.playlist); else if (player.lastVOD) playVOD(...player.lastVOD); }

function showPlayer(title, subtitle, live) {
  $("#player-title").textContent = title;
  $("#player-subtitle").textContent = subtitle || "";
  $("#player-live").classList.toggle("hidden", !live);
  $("#player-fav").classList.toggle("hidden", !live);
  player.el.classList.remove("hidden");
  player.el.setAttribute("aria-hidden", "false");
  wake();
}

function closePlayer() {
  saveVODProgress();
  clearInterval(player.saveTimer);
  player.hls?.destroy();
  player.hls = null;
  player.video.pause();
  player.video.removeAttribute("src");
  player.video.load();
  player.el.classList.add("hidden");
  player.el.setAttribute("aria-hidden", "true");
  status("");
  player.mode = null;
  if (currentTab === "live") renderShell();
}

function wake() {
  player.el.classList.remove("idle");
  clearTimeout(player.idleTimer);
  player.idleTimer = setTimeout(() => { if (!player.video.paused) player.el.classList.add("idle"); }, 4000);
}

function playLive(stream, list) {
  player.mode = "live";
  player.stream = stream;
  if (list?.length) player.playlist = list;
  library.recents = [stream.id, ...library.recents.filter((id) => id !== stream.id)].slice(0, 30);
  saveLibrary();
  showPlayer(stream.name, stream.num ? `Chaîne ${stream.num}` : "", true);
  $("#player-fav").textContent = library.favChannels.includes(stream.id) ? "★" : "☆";
  updateLiveEPG();
  if (!content.epg.has(stream.id)) requestEPG(stream.id);
  startVideo(urls.live(stream.id));
}

function updateLiveEPG() {
  if (player.mode !== "live" || !player.stream) return;
  const now = nowProgram(player.stream.id);
  const next = nextProgram(player.stream.id);
  $("#epg-now").textContent = now ? `${now.title}  ·  ${hm(now.start)}–${hm(now.end)}` : "Pas d'information de programme";
  $("#epg-progress").style.width = now ? `${progress(now)}%` : "0";
  $("#epg-next").textContent = next ? `Ensuite ${hm(next.start)} · ${next.title}` : "";
}
document.addEventListener("epg", (e) => { if (e.detail === player.stream?.id) updateLiveEPG(); });
setInterval(updateLiveEPG, 30000);

function zap(offset) {
  const list = player.playlist;
  if (!list.length || !player.stream) return;
  const i = list.findIndex((s) => s.id === player.stream.id);
  playLive(list[(i + offset + list.length) % list.length], list);
}

function playCatchup(stream, program) {
  playVOD(urls.catchup(stream.id, program), program.title,
    `${stream.name} · ${program.start.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`, null);
}

function playVOD(url, title, subtitle, progressKey) {
  player.mode = "vod";
  player.stream = null;
  player.progressKey = progressKey;
  player.lastVOD = [url, title, subtitle, progressKey];
  showPlayer(title, subtitle, false);
  const p = progressKey ? library.progress[progressKey] : null;
  startVideo(url, p && p.pos / p.dur < 0.95 ? p.pos : 0);
  clearInterval(player.saveTimer);
  player.saveTimer = setInterval(saveVODProgress, 10000);
}

function saveVODProgress() {
  const v = player.video;
  if (player.mode !== "vod" || !player.progressKey || !Number.isFinite(v.duration) || v.currentTime < 10) return;
  library.progress[player.progressKey] = { pos: v.currentTime, dur: v.duration, t: Date.now() };
  saveLibrary();
}

$("#player-close").addEventListener("click", closePlayer);
$("#zap-prev").addEventListener("click", () => zap(-1));
$("#zap-next").addEventListener("click", () => zap(1));
$("#player-fav").addEventListener("click", () => {
  if (!player.stream) return;
  toggle("favChannels", player.stream.id);
  $("#player-fav").textContent = library.favChannels.includes(player.stream.id) ? "★" : "☆";
});
["pointerdown", "pointermove", "touchstart"].forEach((ev) => player.el.addEventListener(ev, wake, { passive: true }));

// Zapping par glissement vertical (en direct)
let touchY = null;
player.el.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
player.el.addEventListener("touchend", (e) => {
  if (player.mode !== "live" || touchY == null) return;
  const dy = e.changedTouches[0].clientY - touchY;
  touchY = null;
  if (Math.abs(dy) > 90) zap(dy < 0 ? 1 : -1);
}, { passive: true });
document.addEventListener("keydown", (e) => {
  if (player.el.classList.contains("hidden")) return;
  if (e.key === "Escape") closePlayer();
  if (player.mode === "live" && e.key === "ArrowUp") zap(-1);
  if (player.mode === "live" && e.key === "ArrowDown") zap(1);
});
document.addEventListener("visibilitychange", () => { if (document.hidden) saveVODProgress(); });

// ---------------------------------------------------------------- démarrage

if (account?.password) renderShell(); else renderLogin();
