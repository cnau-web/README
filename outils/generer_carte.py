# -*- coding: utf-8 -*-
"""Genere carte-exercices.html : la carte interactive du programme.

    python3 outils/generer_carte.py

Chaque exercice est cliquable et ouvre sa fiche (schema, machine, reglages,
execution, erreurs) avec deux liens de recherche video YouTube.
"""
import html as H
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contenu import FICHES, IDX, SEANCES, BLOCS, SEMAINE
from illustrations import ILLUS

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "carte-exercices.html")

# Requete de recherche video, par exercice (le lien ouvre une recherche YouTube).
VIDEO = {
    "developpe_couche": "développé couché barre technique musculation",
    "developpe_incline": "développé incliné haltères technique musculation",
    "ecarte_poulie": "écarté poulie vis à vis pectoraux technique",
    "pec_deck": "pec deck machine écarté technique musculation",
    "dips": "dips barres parallèles pectoraux technique débutant",
    "ecarte_incline": "écarté incliné haltères pectoraux technique",
    "tractions": "tractions technique débutant machine assistée",
    "tirage_vertical": "tirage vertical poulie haute lat pulldown technique",
    "rowing_barre": "rowing barre buste penché technique dos",
    "tirage_horizontal": "tirage horizontal poulie basse technique dos",
    "rowing_haltere": "rowing haltère un bras banc technique dos",
    "pullover_poulie": "pull over poulie haute bras tendus dorsaux technique",
    "extensions_lombaires": "extensions lombaires banc 45 degrés technique",
    "developpe_militaire": "développé militaire barre debout technique épaules",
    "developpe_haltere_assis": "développé haltères assis épaules technique",
    "elevations_laterales": "élévations latérales haltères technique épaules",
    "tirage_menton": "tirage menton poulie prise large technique épaules",
    "oiseau": "oiseau haltères arrière épaules technique",
    "face_pull": "face pull poulie corde technique épaules",
    "shrugs": "shrugs haltères trapèzes technique",
    "planche": "gainage planche ventrale technique position",
    "planche_laterale": "gainage planche latérale technique position",
    "hollow": "hollow body hold gainage technique",
    "releves_jambes": "relevés de jambes suspendu chaise romaine technique abdos",
    "crunch_poulie": "crunch poulie haute corde à genoux technique abdos",
    "crunch_inverse": "crunch inversé au sol technique abdos",
    "russian_twist": "russian twist disque technique obliques",
    "woodchopper": "woodchopper poulie technique obliques",
    "ab_wheel": "roue abdominale ab wheel débutant technique",
}

CLE_GROUPE = {"Pectoraux": "pect", "Dos": "dos", "Épaules": "epaules", "Abdos": "abdos"}
# Quelle seance utilise quel bloc abdominal (le bloc A revient en A et en D).
SEANCE_BLOC = {"A": "A", "B": "B", "C": "C", "D": "A"}
BLOC_DE_SEANCE = {"A": ["A", "D"], "B": ["B"], "C": ["C"]}
YT = "https://www.youtube.com/results?search_query="


def esc(t):
    return H.escape(t, quote=False)


def q(texte):
    from urllib.parse import quote_plus
    return YT + quote_plus(texte)


def construire_donnees():
    """Fiche + seances dans lesquelles l'exercice apparait."""
    d = {}
    for f in FICHES:
        d[f["id"]] = dict(n=IDX[f["id"]], nom=f["nom"], groupe=f["groupe"],
                          g=CLE_GROUPE[f["groupe"]], machine=f["machine"],
                          reglage=f["reglage"], etapes=f["etapes"],
                          erreurs=f["erreurs"], seances=[],
                          video=q(VIDEO[f["id"]]),
                          videoErr=q(VIDEO[f["id"]] + " erreurs à éviter"))
    for titre, _, lignes in SEANCES:
        for fid, _, series, reps, repos, _ in lignes:
            d[fid]["seances"].append(dict(s=titre.split(" — ")[0], v=f"{series} × {reps}", r=repos))
    for titre, _, lignes in BLOCS:
        lettre = titre.split("abdos ")[-1][0]
        for fid, _, series, reps, repos in lignes:
            for seance in BLOC_DE_SEANCE[lettre]:
                d[fid]["seances"].append(
                    dict(s=f"Séance {seance}", v=f"{series} × {reps}", r=repos))
    return d


def ligne(fid, nom, dose, repos, d):
    ex = d[fid]
    return f"""<li class="row-li"><button class="row" type="button" data-id="{fid}" data-g="{ex['g']}"
      aria-haspopup="dialog" data-nom="{esc(nom.lower())}">
  <span class="vign">{ILLUS[fid]().svg()}</span>
  <span class="ligne-txt"><span class="ligne-nom">{esc(nom)}</span>
    <span class="ligne-dose">{esc(dose)}<span class="sep">·</span>repos {esc(repos)}</span></span>
  <span class="chev" aria-hidden="true">›</span>
</button></li>"""


def carte_seance(titre, soustitre, lignes, d, blocs):
    """Une carte par jour : musculation puis abdominaux, dans la même liste."""
    lettre = titre.split("Séance ")[-1][0]
    jour, duree = soustitre.split(" · ")[0], soustitre.split(" · ")[1]
    groupe = titre.split(" — ")[-1].replace("Haut du corps complet", "Haut du corps")
    items = "".join(ligne(fid, nom, f"{series} × {reps}", repos, d)
                    for fid, nom, series, reps, repos, _ in lignes)

    bloc_lettre = SEANCE_BLOC[lettre]
    btitre, _, blignes = next(b for b in blocs if b[0].split("abdos ")[-1][0] == bloc_lettre)
    items += (f'<li class="sous-tete"><span>Abdominaux</span>'
              f'<span class="sous-tete-note">{esc(btitre.split(" — ")[-1])} '
              f'· bloc {bloc_lettre}</span></li>')
    items += "".join(ligne(fid, nom, f"{series} × {reps}", repos, d)
                     for fid, nom, series, reps, repos in blignes)

    return f"""<section class="carte" id="seance-{lettre.lower()}" tabindex="-1">
  <header class="carte-tete">
    <span class="pastille">{esc(lettre)}</span>
    <div><h2>{esc(groupe)} + abdos</h2>
      <p class="carte-sous">{esc(jour)} · {esc(duree)}</p></div>
  </header>
  <ol class="rows">{items}</ol>
</section>"""


def main():
    d = construire_donnees()
    jours = []
    for j, s, _ in SEMAINE:
        if s.startswith("Repos"):
            jours.append(f'<div class="jour off"><span class="jour-nom">{j[:3]}</span>'
                         f'<span class="jour-val">—</span>'
                         f'<span class="jour-quoi">repos</span></div>')
            continue
        lettre = s.split(" — ")[0].replace("Séance ", "").strip()
        groupe = s.split(" — ")[1].split(" + ")[0].replace("Haut du corps complet", "Haut du corps")
        jours.append(
            f'<a class="jour" href="#seance-{lettre.lower()}" '
            f'aria-label="Aller aux exercices de {j.lower()} : séance {lettre}, {esc(groupe.lower())}">'
            f'<span class="jour-nom">{j[:3]}</span>'
            f'<span class="jour-val">{esc(lettre)}</span>'
            f'<span class="jour-quoi">{esc(groupe)}</span></a>')
    semaine = "".join(jours)
    cartes = "".join(carte_seance(t, st, l, d, BLOCS) for t, st, l in SEANCES)

    page = f"""<title>Carte des exercices</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap">
<style>
:root {{
  color-scheme: light;
  --bg:#eef2f6; --surface:#ffffff; --surface-2:#f6f8fb; --ink:#0f1720;
  --muted:#5b6876; --line:#dbe3ec; --accent:#1d4ed8; --on-accent:#ffffff;
  --pect:#1d4ed8; --dos:#047857; --epaules:#b45309; --abdos:#7c3aed;
  --plaque:#f5f7fa; --plaque-line:#e3e9f0;
  --ombre:0 1px 2px rgba(15,23,32,.05), 0 10px 30px rgba(15,23,32,.07);
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    color-scheme: dark;
    --bg:#0d1218; --surface:#151d25; --surface-2:#1a232c; --ink:#e7edf4;
    --muted:#98a5b3; --line:#27313d; --accent:#7ba4ff; --on-accent:#0d1218;
    --pect:#7ba4ff; --dos:#34d399; --epaules:#f5b73c; --abdos:#c0aefc;
    --ombre:0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
  }}
}}
:root[data-theme="dark"] {{
  color-scheme: dark;
  --bg:#0d1218; --surface:#151d25; --surface-2:#1a232c; --ink:#e7edf4;
  --muted:#98a5b3; --line:#27313d; --accent:#7ba4ff; --on-accent:#0d1218;
  --pect:#7ba4ff; --dos:#34d399; --epaules:#f5b73c; --abdos:#c0aefc;
  --ombre:0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
}}
* {{ box-sizing:border-box; }}
body {{ margin:0; background:var(--bg); color:var(--ink);
  font-family:"Source Sans 3",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:16px; line-height:1.5; }}
.wrap {{ max-width:1180px; margin:0 auto; padding-inline:16px; padding-block:0 40px; }}
h1,h2,h3,.pastille,.eyebrow {{ font-family:"Barlow Condensed","Source Sans 3",sans-serif; }}
h1 {{ font-size:clamp(30px,6vw,44px); font-weight:700; letter-spacing:-.01em;
     margin:0; text-wrap:balance; text-transform:uppercase; }}
.eyebrow {{ font-size:13px; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
     color:var(--muted); margin:0 0 4px; }}
.tete {{ padding-block:28px 18px; border-bottom:1px solid var(--line); margin-bottom:22px; }}
.tete p.intro {{ margin:8px 0 0; color:var(--muted); max-width:62ch; }}

.semaine {{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-top:18px; }}
.jour {{ background:var(--surface); border:1px solid var(--line); border-radius:8px;
  padding:7px 4px 6px; text-align:center; display:block; text-decoration:none;
  color:inherit; transition:border-color .15s, transform .15s; }}
a.jour {{ cursor:pointer; }}
a.jour:hover {{ border-color:var(--accent); transform:translateY(-1px); }}
a.jour:focus-visible {{ outline:2px solid var(--accent); outline-offset:2px; }}
.jour-quoi {{ display:block; font-size:10.5px; line-height:1.25; color:var(--muted);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }}
.jour-nom {{ display:block; font-size:11px; letter-spacing:.08em; text-transform:uppercase;
  color:var(--muted); }}
.jour-val {{ display:block; font-family:"Barlow Condensed",sans-serif; font-weight:700;
  font-size:20px; line-height:1.2; }}
.jour.off {{ background:transparent; }}
.jour.off .jour-val {{ color:var(--muted); }}

.filtre {{ display:flex; align-items:center; gap:10px; margin:22px 0 6px; }}
.filtre input {{ flex:1; min-width:0; font:inherit; color:var(--ink);
  background:var(--surface); border:1px solid var(--line); border-radius:9px;
  padding:11px 13px; }}
.filtre input::placeholder {{ color:var(--muted); }}
.filtre input:focus-visible {{ outline:2px solid var(--accent); outline-offset:1px; }}
.vide {{ color:var(--muted); padding:10px 2px; }}

.grille {{ display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(290px,1fr));
  align-items:start; margin-top:16px; }}
.carte {{ background:var(--surface); border:1px solid var(--line); border-radius:14px;
  box-shadow:var(--ombre); overflow:hidden; scroll-margin-top:14px;
  outline:2px solid transparent; outline-offset:3px; transition:outline-color .4s ease; }}
.carte:focus {{ outline:none; }}
.carte.cible {{ outline-color:var(--accent); }}
.carte-tete {{ display:flex; gap:12px; align-items:center; padding:14px 16px;
  border-bottom:1px solid var(--line); }}
.carte-tete h2 {{ margin:0; font-size:20px; font-weight:600; text-transform:uppercase;
  letter-spacing:.02em; }}
.carte-sous {{ margin:1px 0 0; font-size:13px; color:var(--muted); }}
.pastille {{ width:34px; height:34px; flex:0 0 34px; border-radius:9px; display:grid;
  place-items:center; background:var(--ink); color:var(--surface); font-weight:700;
  font-size:19px; }}
.rows {{ list-style:none; margin:0; padding:0; }}
.rows li + li {{ border-top:1px solid var(--line); }}
.sous-tete {{ display:flex; flex-wrap:wrap; align-items:baseline; gap:2px 8px;
  padding:9px 14px; background:var(--surface-2); }}
.sous-tete > span:first-child {{ font-family:"Barlow Condensed","Source Sans 3",sans-serif;
  font-weight:600; font-size:15px; letter-spacing:.1em; text-transform:uppercase;
  color:var(--abdos); }}
.sous-tete-note {{ font-size:13px; color:var(--muted); }}

.row {{ display:flex; align-items:center; gap:12px; width:100%; min-height:62px;
  padding:9px 12px 9px 0; background:none; border:0; border-left:4px solid var(--g);
  color:inherit; font:inherit; text-align:left; cursor:pointer; }}
.row:hover, .row:focus-visible {{ background:var(--surface-2); }}
.row:focus-visible {{ outline:2px solid var(--accent); outline-offset:-2px; }}
.row[data-g="pect"] {{ --g:var(--pect); }} .row[data-g="dos"] {{ --g:var(--dos); }}
.row[data-g="epaules"] {{ --g:var(--epaules); }} .row[data-g="abdos"] {{ --g:var(--abdos); }}
.vign {{ flex:0 0 76px; width:76px; background:var(--plaque); border:1px solid var(--plaque-line);
  border-radius:7px; padding:2px; display:block; }}
.vign svg {{ display:block; width:100%; height:auto; }}
.ligne-txt {{ flex:1; min-width:0; }}
.ligne-nom {{ display:block; font-weight:600; line-height:1.25; }}
.ligne-dose {{ display:block; font-size:13.5px; color:var(--muted);
  font-variant-numeric:tabular-nums; }}
.sep {{ padding:0 6px; opacity:.6; }}
.chev {{ color:var(--muted); font-size:22px; line-height:1; }}

dialog {{ border:0; padding:0; background:transparent; width:100%; height:100%;
  max-width:100%; max-height:100%; margin:0; color:var(--ink); overflow:hidden; }}
dialog::backdrop {{ background:rgba(8,12,18,.55); }}
.sheet {{ background:var(--surface); border-radius:16px; box-shadow:var(--ombre);
  width:100%; max-width:680px; max-height:calc(100dvh - 32px);
  overflow-y:auto; overflow-x:hidden; margin:auto; position:relative; }}
.sheet p, .sheet li, .sheet h2 {{ overflow-wrap:break-word; }}
.dlg-pos {{ display:grid; place-items:center; min-height:100%; width:100%;
  padding:12px; }}
.sheet-tete {{ position:sticky; top:0; background:var(--surface); z-index:2;
  display:flex; flex-wrap:wrap; align-items:flex-start; gap:10px 12px;
  padding:16px 16px 12px; border-bottom:1px solid var(--line); }}
.sheet-tete > div {{ flex:1 1 170px; min-width:0; }}
.sheet-tete h2 {{ margin:2px 0 0; font-size:24px; font-weight:600; line-height:1.15;
  text-wrap:balance; }}
.num {{ flex:0 0 30px; width:30px; height:30px; border-radius:50%; display:grid;
  place-items:center; background:var(--g,var(--accent)); color:var(--on-accent);
  font-weight:700; font-size:15px; font-family:"Barlow Condensed",sans-serif; }}
.fermer {{ margin-left:auto; flex:0 0 auto; background:var(--surface-2); color:var(--ink);
  border:1px solid var(--line); border-radius:8px; padding:7px 12px; font:inherit;
  cursor:pointer; }}
.fermer:hover {{ background:var(--bg); }}
.sheet-corps {{ padding:16px; display:grid; gap:16px; }}
.fig {{ background:var(--plaque); border:1px solid var(--plaque-line); border-radius:12px;
  padding:6px; }}
.fig svg {{ display:block; width:100%; height:auto; }}
.legende {{ display:flex; flex-wrap:wrap; gap:14px; font-size:13px; color:var(--muted);
  margin-top:6px; }}
.legende i {{ display:inline-block; width:22px; height:0; border-top:3px solid #1f2937;
  vertical-align:middle; margin-right:6px; }}
.legende i.clair {{ border-top-color:#b6bec9; }} .legende i.rouge {{ border-top-color:#dc2626; }}
.doses {{ display:flex; flex-wrap:wrap; gap:8px; }}
.dose {{ background:var(--surface-2); border:1px solid var(--line); border-radius:8px;
  padding:6px 10px; font-size:14px; font-variant-numeric:tabular-nums; }}
.dose b {{ font-weight:600; }}
.bloc h3 {{ margin:0 0 4px; font-size:13px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; color:var(--muted); }}
.bloc p {{ margin:0; }}
.bloc ol {{ margin:0; padding-left:20px; }}
.bloc ol li {{ margin-bottom:3px; }}
.bloc.err li {{ color:#b91c1c; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) .bloc.err li {{ color:#fca5a5; }} }}
:root[data-theme="dark"] .bloc.err li {{ color:#fca5a5; }}
.actions {{ display:flex; flex-wrap:wrap; gap:10px; position:sticky; bottom:0; z-index:1;
  background:linear-gradient(to top,var(--surface) 72%,transparent);
  padding:12px 0 2px; }}
.btn {{ display:inline-flex; align-items:center; gap:8px; padding:12px 16px; border-radius:10px;
  font-weight:600; text-decoration:none; border:1px solid var(--line); color:var(--ink);
  background:var(--surface-2); }}
.btn.primaire {{ background:var(--accent); color:var(--on-accent); border-color:transparent; }}
.btn:hover {{ filter:brightness(.97); }}
.btn:focus-visible {{ outline:2px solid var(--accent); outline-offset:2px; }}
.note {{ font-size:13.5px; color:var(--muted); margin:0; }}
footer {{ margin-top:30px; padding-top:16px; border-top:1px solid var(--line);
  color:var(--muted); font-size:14px; }}
@media (max-width:560px) {{
  .semaine {{ grid-template-columns:repeat(4,1fr); }}
  .dlg-pos {{ padding:0; align-items:end; }}
  .sheet {{ border-radius:16px 16px 0 0; max-height:92dvh; }}
  .btn {{ flex:1 1 auto; justify-content:center; }}
  .vign {{ flex-basis:66px; width:66px; }}
}}
html {{ scroll-behavior:smooth; }}
@media (prefers-reduced-motion:reduce) {{
  html {{ scroll-behavior:auto; }}
  * {{ animation:none !important; transition:none !important; }}
}}
</style>

<div class="wrap">
  <header class="tete">
    <p class="eyebrow">Musculation du soir · lundi à vendredi</p>
    <h1>Carte des exercices</h1>
    <p class="intro">Épaules, dos, pectoraux, abdominaux. Touche un exercice pour ouvrir sa fiche :
      schéma du mouvement, machine à chercher dans la salle, réglages, exécution, erreurs à éviter,
      et deux liens vidéo.</p>
    <div class="semaine">{semaine}</div>
  </header>

  <div class="filtre">
    <label for="q" class="sr-only" style="position:absolute;left:-9999px">Filtrer les exercices</label>
    <input id="q" type="search" placeholder="Filtrer : haltère, poulie, dos…" autocomplete="off">
  </div>
  <p class="vide" id="vide" hidden>Aucun exercice ne correspond.</p>

  <div class="grille" id="grille">{cartes}</div>

  <footer>
    <p class="note">Les boutons vidéo ouvrent une <b>recherche YouTube</b> sur le nom de l'exercice :
    les résultats changent avec le temps, choisis une démonstration récente et complète plutôt que
    la première miniature. Les schémas et les fiches reprennent le PDF du programme.</p>
  </footer>
</div>

<dialog id="dlg" aria-labelledby="dlg-nom">
  <div class="dlg-pos">
    <div class="sheet">
      <div class="sheet-tete">
        <span class="num" id="dlg-num"></span>
        <div><h2 id="dlg-nom"></h2><p class="note" id="dlg-groupe"></p></div>
        <button class="fermer" type="button" id="dlg-fermer">Fermer</button>
      </div>
      <div class="sheet-corps">
        <div>
          <div class="fig" id="dlg-fig"></div>
          <div class="legende">
            <span><i></i>Départ</span><span><i class="clair"></i>Arrivée</span>
            <span><i class="rouge"></i>Sens du mouvement</span>
          </div>
        </div>
        <div class="doses" id="dlg-doses"></div>
        <div class="bloc"><h3>Quelle machine</h3><p id="dlg-machine"></p></div>
        <div class="bloc"><h3>Réglages avant de commencer</h3><p id="dlg-reglage"></p></div>
        <div class="bloc"><h3>Exécution</h3><ol id="dlg-etapes"></ol></div>
        <div class="bloc err"><h3>Erreurs à éviter</h3><ol id="dlg-erreurs"></ol></div>
        <div class="actions">
          <a class="btn primaire" id="dlg-video" href="#" target="_blank" rel="noopener">▶ Voir la démonstration</a>
          <a class="btn" id="dlg-video-err" href="#" target="_blank" rel="noopener">Erreurs fréquentes</a>
        </div>
      </div>
    </div>
  </div>
</dialog>

<script id="donnees" type="application/json">{json.dumps(d, ensure_ascii=False)}</script>
<script>
(function () {{
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var dlg = document.getElementById('dlg');
  var el = function (id) {{ return document.getElementById(id); }};
  var champ = el('q');

  function liste(cible, items) {{
    cible.textContent = '';
    items.forEach(function (t) {{
      var li = document.createElement('li'); li.textContent = t; cible.appendChild(li);
    }});
  }}

  function ouvrir(btn) {{
    var ex = D[btn.dataset.id];
    if (!ex) return;
    var svg = btn.querySelector('svg');
    el('dlg-fig').textContent = '';
    if (svg) el('dlg-fig').appendChild(svg.cloneNode(true));
    el('dlg-num').textContent = ex.n;
    el('dlg-num').style.setProperty('--g', 'var(--' + ex.g + ')');
    el('dlg-nom').textContent = ex.nom;
    el('dlg-groupe').textContent = ex.groupe + ' · fiche n° ' + ex.n + ' du PDF';
    var doses = el('dlg-doses'); doses.textContent = '';
    ex.seances.forEach(function (s) {{
      var d = document.createElement('span'); d.className = 'dose';
      d.innerHTML = '<b></b> <span></span>';
      d.querySelector('b').textContent = s.s;
      d.querySelector('span').textContent = s.v + ' — repos ' + s.r;
      doses.appendChild(d);
    }});
    el('dlg-machine').textContent = ex.machine;
    el('dlg-reglage').textContent = ex.reglage;
    liste(el('dlg-etapes'), ex.etapes);
    liste(el('dlg-erreurs'), ex.erreurs);
    el('dlg-video').href = ex.video;
    el('dlg-video-err').href = ex.videoErr;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('.sheet').scrollTop = 0;
  }}

  var doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function allerA(ancre) {{
    var cible = document.getElementById(ancre);
    if (!cible) return;
    if (champ.value) {{ champ.value = ''; filtrer(); }}   // une carte filtrée resterait cachée
    cible.scrollIntoView({{ behavior: doux ? 'smooth' : 'auto', block: 'start' }});
    cible.focus({{ preventScroll: true }});
    document.querySelectorAll('.carte.cible').forEach(function (c) {{ c.classList.remove('cible'); }});
    cible.classList.add('cible');
    clearTimeout(allerA.t);
    allerA.t = setTimeout(function () {{ cible.classList.remove('cible'); }}, 1800);
  }}

  document.addEventListener('click', function (e) {{
    var jour = e.target.closest('a.jour');
    if (jour) {{ e.preventDefault(); allerA(jour.getAttribute('href').slice(1)); return; }}
    var btn = e.target.closest('.row');
    if (btn) {{ ouvrir(btn); return; }}
    if (e.target.id === 'dlg-fermer') {{ dlg.close(); return; }}
    if (e.target === dlg || e.target.classList.contains('dlg-pos')) dlg.close();
  }});

  function filtrer() {{
    var t = champ.value.trim().toLowerCase(), n = 0;
    document.querySelectorAll('.row').forEach(function (r) {{
      var ex = D[r.dataset.id];
      var foin = r.dataset.nom + ' ' + ex.groupe.toLowerCase() + ' ' + ex.machine.toLowerCase();
      var ok = !t || foin.indexOf(t) !== -1;
      r.parentElement.hidden = !ok; if (ok) n++;
    }});
    document.querySelectorAll('.sous-tete').forEach(function (st) {{
      var reste = false;
      for (var n = st.nextElementSibling; n; n = n.nextElementSibling) {{
        if (!n.hidden) {{ reste = true; break; }}
      }}
      st.hidden = !reste;
    }});
    document.querySelectorAll('.carte').forEach(function (c) {{
      c.hidden = !c.querySelector('.rows > li.row-li:not([hidden])');
    }});
    el('vide').hidden = n > 0;
  }}
  champ.addEventListener('input', filtrer);
}})();
</script>
"""
    with open(SORTIE, "w", encoding="utf-8") as fh:
        fh.write(page)
    print("Carte ecrite :", SORTIE, f"({len(page)//1024} Ko)")


if __name__ == "__main__":
    main()
