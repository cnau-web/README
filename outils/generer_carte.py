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
from contenu import FICHES, IDX, SEMAINE, PROGRAMMES
import traductions as TR
from traductions import UI, GROUPES, MATERIELS, JOURS, SEANCE_GROUPE, BLOCS_NOM, LANGUES
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
    "dragon_flag": "dragon flag progression négative technique abdos",
    "crunch_decline": "crunch banc décliné lesté disque technique abdos",
    "v_ups": "v ups exercice abdos technique",
    "releves_jambes": "relevés de jambes suspendu chaise romaine technique abdos",
    "crunch_poulie": "crunch poulie haute corde à genoux technique abdos",
    "crunch_inverse": "crunch inversé au sol technique abdos",
    "russian_twist": "russian twist disque technique obliques",
    "woodchopper": "woodchopper poulie technique obliques",
    "ab_wheel": "roue abdominale ab wheel débutant technique",
    "developpe_couche_halteres": "développé couché haltères technique musculation",
    "developpe_decline": "développé décliné barre pectoraux technique",
    "presse_pectoraux": "presse à pectoraux machine chest press technique",
    "ecarte_poulie_basse": "écarté poulie basse de bas en haut pectoraux technique",
    "pompes": "pompes lestées technique exécution",
    "tractions_supination": "tractions prise supination chin up technique",
    "rowing_machine": "rowing machine poitrine appuyée technique dos",
    "rowing_t": "rowing barre en T technique dos",
    "pullover_haltere": "pull over haltère banc technique dorsaux",
    "presse_epaules": "presse à épaules machine technique",
    "elevations_poulie": "élévations latérales à la poulie un bras technique",
    "elevations_frontales": "élévations frontales disque épaules technique",
    "oiseau_poulie": "oiseau poulie câbles croisés arrière épaule technique",
    "shrugs_barre": "shrugs barre trapèzes technique",
}

CLE_GROUPE = {"Pectoraux": "pect", "Dos": "dos", "Épaules": "epaules", "Abdos": "abdos"}

# Materiel principal de chaque exercice, pour le menu de filtrage.
MATERIEL = {
    "barre": ("Barre", [
        "developpe_couche", "developpe_decline", "rowing_barre", "rowing_t",
        "developpe_militaire", "shrugs_barre"]),
    "halteres": ("Haltères et disques", [
        "developpe_incline", "ecarte_incline", "developpe_couche_halteres",
        "rowing_haltere", "pullover_haltere", "developpe_haltere_assis",
        "elevations_laterales", "oiseau", "shrugs", "elevations_frontales",
        "crunch_decline", "russian_twist"]),
    "poulie": ("Poulie et câbles", [
        "ecarte_poulie", "ecarte_poulie_basse", "tirage_vertical", "tirage_horizontal",
        "pullover_poulie", "tirage_menton", "face_pull", "elevations_poulie",
        "oiseau_poulie", "crunch_poulie", "woodchopper"]),
    "machine": ("Machine guidée", [
        "pec_deck", "presse_pectoraux", "rowing_machine", "presse_epaules"]),
    "corps": ("Poids du corps", [
        "dips", "pompes", "tractions", "tractions_supination", "extensions_lombaires",
        "dragon_flag", "v_ups", "releves_jambes", "crunch_inverse", "ab_wheel",
        "planche", "planche_laterale", "hollow"]),
}
MAT_DE = {fid: cle for cle, (_, ids) in MATERIEL.items() for fid in ids}
# Quelle seance utilise quel bloc abdominal (le bloc A revient en A et en D).
SEANCE_BLOC = {"A": "A", "B": "B", "C": "C", "D": "D"}
BLOC_DE_SEANCE = {"A": ["A"], "B": ["B"], "C": ["C"], "D": ["D"]}
YT = "https://www.youtube.com/results?search_query="


def esc(t):
    return H.escape(t, quote=False)


def tri(fr, en, es):
    """Attributs de traduction posés sur l'élément qui porte le texte."""
    return (f'data-t-fr="{H.escape(fr, quote=True)}" '
            f'data-t-en="{H.escape(en, quote=True)}" '
            f'data-t-es="{H.escape(es, quote=True)}"')


A = {cle: tri(*v) for cle, v in UI.items()}


def q(texte):
    from urllib.parse import quote_plus
    return YT + quote_plus(texte)


def construire_donnees():
    """Fiche + seances (des deux programmes) dans lesquelles l'exercice apparait."""
    d = {}
    for f in FICHES:
        fid, t = f["id"], {}
        for i, (code, _) in enumerate(LANGUES):
            src = f if i == 0 else (TR.FICHES_EN if i == 1 else TR.FICHES_ES)[fid]
            t[code] = dict(nom=src["nom"], machine=src["machine"], reglage=src["reglage"],
                           etapes=list(src["etapes"]), erreurs=list(src["erreurs"]),
                           groupe=GROUPES[f["groupe"]][i],
                           video=q(VIDEO[fid] if i == 0
                                   else src["nom"] + " " + TR.SUFFIXE_VIDEO[i]))
        d[fid] = dict(n=IDX[fid], g=CLE_GROUPE[f["groupe"]], seances=[], t=t)

    def dose(fid, prog, lettre, valeur, repos):
        e = dict(p=prog, l=lettre, v=[TR.dose(valeur, i) for i in range(3)], r=repos)
        if e not in d[fid]["seances"]:
            d[fid]["seances"].append(e)

    for prog in PROGRAMMES:
        for titre, _, lignes in prog["seances"]:
            lettre = titre.split("Séance ")[-1][0]
            for fid, _, series, reps, repos, _ in lignes:
                dose(fid, prog["cle"], lettre, f"{series} × {reps}", repos)
        for lettre, (fid, _, series, duree, repos) in prog["gainage"].items():
            dose(fid, prog["cle"], lettre, f"{series} × {duree}", repos)
        for titre, _, lignes in prog["blocs"]:
            bl = titre.split("abdos ")[-1][0]
            for fid, _, series, reps, repos in lignes:
                for lettre in BLOC_DE_SEANCE[bl]:
                    dose(fid, prog["cle"], lettre, f"{series} × {reps}", repos)
    return d


ILLU = {f["id"]: f.get("illu", f["id"]) for f in FICHES}


def ligne(fid, nom, dose, repos, d):
    noms = tuple(d[fid]["t"][c]["nom"] for c, _ in LANGUES)
    doses = tuple(f"{TR.dose(dose, i)} · {UI['repos'][i]} {TR.dose(repos, i)}" for i in range(3))
    return f"""<li class="row-li"><button class="row" type="button" data-id="{fid}"
      data-g="{d[fid]['g']}" data-m="{MAT_DE[fid]}" aria-haspopup="dialog">
  <span class="vign">{ILLUS[ILLU[fid]]().svg()}</span>
  <span class="ligne-txt"><span class="ligne-nom" {tri(*noms)}>{esc(noms[0])}</span>
    <span class="ligne-dose" {tri(*doses)}>{esc(doses[0])}</span></span>
  <span class="chev" aria-hidden="true">›</span>
</button></li>"""


def carte_seance(titre, soustitre, lignes, d, prog):
    """Une carte par jour : musculation, abdominaux puis gainage, dans une seule liste."""
    blocs, gainage, cle = prog["blocs"], prog["gainage"], prog["cle"]
    lettre = titre.split("Séance ")[-1][0]
    jour, duree = soustitre.split(" · ")[0], soustitre.split(" · ")[1]
    groupe = titre.split(" — ")[-1]
    items = "".join(ligne(fid, nom, f"{series} × {reps}", repos, d)
                    for fid, nom, series, reps, repos, _ in lignes)

    bloc_lettre = SEANCE_BLOC[lettre]
    btitre, _, blignes = next(b for b in blocs if b[0].split("abdos ")[-1][0] == bloc_lettre)
    bn = BLOCS_NOM[btitre.split(" — ")[-1]]
    notes = tuple(f"{bn[i]} · {('bloc', 'block', 'bloque')[i]} {bloc_lettre}" for i in range(3))
    items += (f'<li class="sous-tete"><span {A["abdominaux"]}>{esc(UI["abdominaux"][0])}</span>'
              f'<span class="sous-tete-note" {tri(*notes)}>{esc(notes[0])}</span></li>')
    items += "".join(ligne(fid, nom, f"{series} × {reps}", repos, d)
                     for fid, nom, series, reps, repos in blignes)

    titres = tuple(f"{SEANCE_GROUPE[groupe][i]} {UI['plus_abdos'][i]}" for i in range(3))
    sous = tuple(f"{JOURS[jour][i]} · {TR.duree(duree, i)}" for i in range(3))

    gfid, gnom, gser, gduree, grepos = gainage[lettre]
    items += (f'<li class="sous-tete"><span {A["gainage"]}>{esc(UI["gainage"][0])}</span>'
              f'<span class="sous-tete-note" {A["gainage_note"]}>'
              f'{esc(UI["gainage_note"][0])}</span></li>')
    items += ligne(gfid, gnom, f"{gser} × {gduree}", grepos, d)

    return f"""<section class="carte" id="p{cle}-seance-{lettre.lower()}"
  data-seance="{lettre.lower()}" tabindex="-1">
  <header class="carte-tete">
    <span class="pastille">{esc(lettre)}</span>
    <div><h2 {tri(*titres)}>{esc(titres[0])}</h2>
      <p class="carte-sous" {tri(*sous)}>{esc(sous[0])}</p></div>
  </header>
  <ol class="rows">{items}</ol>
</section>"""


def main():
    d = construire_donnees()
    jours = []
    for j, txt, _ in SEMAINE:
        abrev = tuple(JOURS[j][i][:3].upper() for i in range(3))
        if txt.startswith("Repos"):
            jours.append(f'<div class="jour off"><span class="jour-nom" {tri(*abrev)}>{abrev[0]}</span>'
                         f'<span class="jour-val">—</span>'
                         f'<span class="jour-quoi" {A["repos_jour"]}>{esc(UI["repos_jour"][0])}</span></div>')
            continue
        lettre = txt.split(" — ")[0].replace("Séance ", "").strip()
        groupe = txt.split(" — ")[1].split(" + ")[0]
        gr = SEANCE_GROUPE[groupe]
        jours.append(
            f'<a class="jour" href="#pA-seance-{lettre.lower()}" data-seance="{lettre.lower()}" '
            f'aria-label="{esc(JOURS[j][0])} — {esc(groupe)}">'
            f'<span class="jour-nom" {tri(*abrev)}>{abrev[0]}</span>'
            f'<span class="jour-val">{esc(lettre)}</span>'
            f'<span class="jour-quoi" {tri(*gr)}>{esc(gr[0])}</span></a>')
    semaine = "".join(jours)
    options = f'<option value="" {A["tous"]}>{esc(UI["tous"][0])}</option>'
    options += f'<optgroup label="{esc(UI["opt_groupe"][0])}">'
    for fr, c in (("Pectoraux", "pect"), ("Dos", "dos"), ("Épaules", "epaules"),
                  ("Abdos", "abdos")):
        g = GROUPES[fr]
        options += f'<option value="g:{c}" {tri(*g)}>{esc(g[0])}</option>'
    options += f'</optgroup><optgroup label="{esc(UI["opt_materiel"][0])}">'
    for cle in MATERIEL:
        m = MATERIELS[cle]
        options += f'<option value="m:{cle}" {tri(*m)}>{esc(m[0])}</option>'
    options += "</optgroup>"

    langues = "".join(f'<option value="{c}">{esc(n)}</option>' for c, n in LANGUES)
    ui_json = json.dumps({k: list(v) for k, v in UI.items()}, ensure_ascii=False)

    grilles, onglets = "", ""
    for i, prog in enumerate(PROGRAMMES):
        cartes = "".join(carte_seance(t, st, l, d, prog) for t, st, l in prog["seances"])
        grilles += (f'<div class="grille" data-prog="{prog["cle"]}"'
                    f'{"" if i == 0 else " hidden"}>{cartes}</div>')
        nom_p = tuple(f'{UI["programme"][k]} {prog["cle"]}' for k in range(3))
        sous_p = UI["prog_sous_a"] if i == 0 else UI["prog_sous_b"]
        onglets += (f'<button class="onglet" type="button" role="tab" data-prog="{prog["cle"]}"'
                    f' aria-selected="{"true" if i == 0 else "false"}" {tri(*nom_p)}>'
                    f'{esc(nom_p[0])}<span {tri(*sous_p)}>{esc(sous_p[0])}</span></button>')

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
[hidden] {{ display:none !important; }}
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

.onglets {{ display:flex; gap:8px; margin:22px 0 0; flex-wrap:wrap; }}
.onglet {{ flex:1 1 200px; text-align:left; font:inherit; cursor:pointer;
  background:var(--surface); color:var(--muted); border:1px solid var(--line);
  border-radius:11px; padding:10px 14px; font-family:"Barlow Condensed","Source Sans 3",sans-serif;
  font-size:19px; font-weight:600; text-transform:uppercase; letter-spacing:.02em;
  transition:border-color .15s, color .15s; }}
.onglet span {{ display:block; font-family:"Source Sans 3",sans-serif; font-size:12.5px;
  font-weight:400; text-transform:none; letter-spacing:0; color:var(--muted); margin-top:1px; }}
.onglet[aria-selected="true"] {{ background:var(--ink); color:var(--surface);
  border-color:var(--ink); }}
.onglet[aria-selected="true"] span {{ color:var(--surface); opacity:.75; }}
.onglet:focus-visible {{ outline:2px solid var(--accent); outline-offset:2px; }}
.reglages {{ display:flex; gap:10px 18px; flex-wrap:wrap; margin:14px 0 6px; }}
.champ {{ flex:1 1 240px; display:flex; align-items:center; gap:10px; }}
.champ label {{ font-size:12.5px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; color:var(--muted); }}
.champ select {{ flex:1; min-width:0; font:inherit; font-weight:600; color:var(--ink);
  background:var(--surface); border:1px solid var(--line); border-radius:9px;
  padding:11px 13px; cursor:pointer; }}
.champ select:focus-visible {{ outline:2px solid var(--accent); outline-offset:1px; }}
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
button.btn {{ font:inherit; font-weight:600; cursor:pointer; }}
button.btn:disabled {{ opacity:.45; cursor:default; }}
.btn:hover {{ filter:brightness(.97); }}
.btn:focus-visible {{ outline:2px solid var(--accent); outline-offset:2px; }}
.note {{ font-size:13.5px; color:var(--muted); margin:0; }}
.rotation {{ margin:9px 2px 0; max-width:70ch; }}
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
    <p class="eyebrow" {A["sur_titre"]}>{esc(UI["sur_titre"][0])}</p>
    <h1 {A["titre"]}>{esc(UI["titre"][0])}</h1>
    <p class="intro" {A["intro"]}>{esc(UI["intro"][0])}</p>
    <div class="semaine">{semaine}</div>
  </header>

  <div class="reglages">
    <div class="champ"><label for="langue" {A["langue"]}>{esc(UI["langue"][0])}</label>
      <select id="langue">{langues}</select></div>
    <div class="champ"><label for="q" {A["filtrer"]}>{esc(UI["filtrer"][0])}</label>
      <select id="q">{options}</select></div>
  </div>
  <p class="vide" id="vide" hidden {A["vide"]}>{esc(UI["vide"][0])}</p>

  <div class="onglets" role="tablist" aria-label="Choix du programme">{onglets}</div>
  <p class="note rotation" {A["rotation"]}>{esc(UI["rotation"][0])}</p>
  {grilles}

  <footer>
    <p class="note" {A["note_video"]}>{esc(UI["note_video"][0])}</p>
  </footer>
</div>

<dialog id="dlg" aria-labelledby="dlg-nom">
  <div class="dlg-pos">
    <div class="sheet">
      <div class="sheet-tete">
        <span class="num" id="dlg-num"></span>
        <div><h2 id="dlg-nom"></h2><p class="note" id="dlg-groupe"></p></div>
        <button class="fermer" type="button" id="dlg-fermer" {A["fermer"]}>{esc(UI["fermer"][0])}</button>
      </div>
      <div class="sheet-corps">
        <div>
          <div class="fig" id="dlg-fig"></div>
          <div class="legende">
            <span><i></i><span {A["depart"]}>{esc(UI["depart"][0])}</span></span>
            <span><i class="clair"></i><span {A["arrivee"]}>{esc(UI["arrivee"][0])}</span></span>
            <span><i class="rouge"></i><span {A["sens"]}>{esc(UI["sens"][0])}</span></span>
          </div>
        </div>
        <div class="doses" id="dlg-doses"></div>
        <div class="bloc"><h3 {A["machine"]}>{esc(UI["machine"][0])}</h3><p id="dlg-machine"></p></div>
        <div class="bloc"><h3 {A["reglage"]}>{esc(UI["reglage"][0])}</h3><p id="dlg-reglage"></p></div>
        <div class="bloc"><h3 {A["execution"]}>{esc(UI["execution"][0])}</h3><ol id="dlg-etapes"></ol></div>
        <div class="bloc err"><h3 {A["erreurs"]}>{esc(UI["erreurs"][0])}</h3><ol id="dlg-erreurs"></ol></div>
        <div class="actions">
          <a class="btn primaire" id="dlg-video" href="#" target="_blank" rel="noopener"
             {A["video"]}>{esc(UI["video"][0])}</a>
          <button class="btn" type="button" id="dlg-suivant">{esc(UI["suivant"][0])}</button>
        </div>
      </div>
    </div>
  </div>
</dialog>

<script id="donnees" type="application/json">{json.dumps(d, ensure_ascii=False)}</script>
<script id="ui" type="application/json">{ui_json}</script>
<script>
(function () {{
  var D = JSON.parse(document.getElementById('donnees').textContent);
  var U = JSON.parse(document.getElementById('ui').textContent);
  var LANGS = ['fr', 'en', 'es'];
  var LANG = 'fr';
  var dlg = document.getElementById('dlg');
  function t(cle) {{ return U[cle][LANGS.indexOf(LANG)]; }}
  var el = function (id) {{ return document.getElementById(id); }};
  var champ = el('q');

  function liste(cible, items) {{
    cible.textContent = '';
    items.forEach(function (t) {{
      var li = document.createElement('li'); li.textContent = t; cible.appendChild(li);
    }});
  }}

  var courant = null;

  function suivantDe(btn) {{
    for (var n = btn.parentElement.nextElementSibling; n; n = n.nextElementSibling) {{
      if (n.classList.contains('row-li') && !n.hidden) return n.querySelector('.row');
    }}
    return null;                                   // dernier exercice de la séance
  }}

  function ouvrir(btn) {{
    var ex = D[btn.dataset.id];
    if (!ex) return;
    courant = btn;
    var svg = btn.querySelector('svg');
    el('dlg-fig').textContent = '';
    if (svg) el('dlg-fig').appendChild(svg.cloneNode(true));
    el('dlg-num').textContent = ex.n;
    el('dlg-num').style.setProperty('--g', 'var(--' + ex.g + ')');
    var i = LANGS.indexOf(LANG), f = ex.t[LANG];
    el('dlg-nom').textContent = f.nom;
    el('dlg-groupe').textContent = f.groupe + ' · ' + t('fiche_no') + ' ' + ex.n;
    var doses = el('dlg-doses'); doses.textContent = '';
    ex.seances.forEach(function (s) {{
      var d = document.createElement('span'); d.className = 'dose';
      d.innerHTML = '<b></b> <span></span>';
      d.querySelector('b').textContent = s.p + ' · ' + t('seance') + ' ' + s.l;
      d.querySelector('span').textContent = s.v[i] + ' — ' + t('repos') + ' ' + s.r;
      doses.appendChild(d);
    }});
    el('dlg-machine').textContent = f.machine;
    el('dlg-reglage').textContent = f.reglage;
    liste(el('dlg-etapes'), f.etapes);
    liste(el('dlg-erreurs'), f.erreurs);
    el('dlg-video').href = f.video;
    var suiv = suivantDe(btn), bs = el('dlg-suivant');
    bs.disabled = !suiv;
    bs.textContent = suiv ? t('suivant') : t('fin');
    bs.title = suiv ? D[suiv.dataset.id].t[LANG].nom : '';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('.sheet').scrollTop = 0;
  }}

  var doux = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var selLangue = el('langue');

  function traduire(l) {{
    if (LANGS.indexOf(l) === -1) return;
    LANG = l;
    selLangue.value = l;
    document.documentElement.lang = l;
    document.title = t('titre');
    document.querySelectorAll('[data-t-fr]').forEach(function (n) {{
      var v = n.getAttribute('data-t-' + l);
      if (v !== null) n.textContent = v;
    }});
    try {{ localStorage.setItem('langue', l); }} catch (e) {{}}
    if (dlg.open && courant) ouvrir(courant);
  }}

  selLangue.addEventListener('change', function () {{ traduire(selLangue.value); }});
  try {{
    var lm = localStorage.getItem('langue');
    if (lm) traduire(lm);
  }} catch (e) {{}}

  function choisirProg(cle, defiler) {{
    var connu = false;
    document.querySelectorAll('.onglet').forEach(function (o) {{
      var actif = o.dataset.prog === cle;
      if (actif) connu = true;
      o.setAttribute('aria-selected', actif ? 'true' : 'false');
    }});
    if (!connu) return;
    document.querySelectorAll('.grille').forEach(function (g) {{
      g.hidden = g.dataset.prog !== cle;
    }});
    try {{ localStorage.setItem('programme', cle); }} catch (e) {{}}
    if (defiler) document.querySelector('.grille:not([hidden])')
      .scrollIntoView({{ behavior: doux ? 'smooth' : 'auto', block: 'start' }});
  }}

  try {{
    var memo = localStorage.getItem('programme');
    if (memo) choisirProg(memo, false);
  }} catch (e) {{}}

  function allerA(lettre) {{
    var cible = document.querySelector('.grille:not([hidden]) .carte[data-seance="' + lettre + '"]');
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
    var onglet = e.target.closest('.onglet');
    if (onglet) {{ choisirProg(onglet.dataset.prog, true); return; }}
    var jour = e.target.closest('a.jour');
    if (jour) {{ e.preventDefault(); allerA(jour.dataset.seance); return; }}
    var btn = e.target.closest('.row');
    if (btn) {{ ouvrir(btn); return; }}
    if (e.target.id === 'dlg-fermer') {{ dlg.close(); return; }}
    if (e.target.id === 'dlg-suivant') {{
      var suiv = courant && suivantDe(courant);
      if (suiv) ouvrir(suiv);
      return;
    }}
    if (e.target === dlg || e.target.classList.contains('dlg-pos')) dlg.close();
  }});

  function filtrer() {{
    var v = champ.value, cle = v.slice(2), par = v.slice(0, 1), n = 0;
    document.querySelectorAll('.row').forEach(function (r) {{
      var ok = !v || (par === 'g' ? r.dataset.g === cle : r.dataset.m === cle);
      r.parentElement.hidden = !ok; if (ok) n++;
    }});
    document.querySelectorAll('.sous-tete').forEach(function (st) {{
      var reste = false;
      for (var n = st.nextElementSibling;
           n && !n.classList.contains('sous-tete'); n = n.nextElementSibling) {{
        if (!n.hidden) {{ reste = true; break; }}
      }}
      st.hidden = !reste;
    }});
    document.querySelectorAll('.carte').forEach(function (c) {{
      c.hidden = !c.querySelector('.rows > li.row-li:not([hidden])');
    }});
    el('vide').hidden = n > 0;
  }}
  champ.addEventListener('change', filtrer);
}})();
</script>
"""
    with open(SORTIE, "w", encoding="utf-8") as fh:
        fh.write(page)
    print("Carte ecrite :", SORTIE, f"({len(page)//1024} Ko)")


if __name__ == "__main__":
    main()
