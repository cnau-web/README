# -*- coding: utf-8 -*-
"""Genere le PDF illustre du programme de musculation du soir.

    python3 outils/generer_pdf.py

Produit programme-musculation-soir.pdf a la racine du depot (rendu HTML -> PDF
via le Chromium headless deja present dans l'environnement).
"""
import html as H
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from contenu import FICHES, IDX, SEMAINE, PROGRAMMES
from illustrations import ILLUS

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, "programme-musculation-soir.pdf")
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

COULEUR = {"Pectoraux": "#1d4ed8", "Dos": "#047857",
           "Épaules": "#b45309", "Abdos": "#7c3aed"}

CSS = """
@page { size: A4; margin: 13mm 12mm 12mm 12mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:"DejaVu Sans",Arial,Helvetica,sans-serif;
       font-size:9.2pt; line-height:1.42; color:#111827; }
h1 { font-size:22pt; margin:0 0 2mm; letter-spacing:-.4pt; }
h2 { font-size:13pt; margin:0 0 3mm; padding-bottom:1.5mm;
     border-bottom:2px solid #111827; }
h3 { font-size:10.5pt; margin:5mm 0 2mm; }
p { margin:0 0 2.5mm; }
.sub { color:#4b5563; font-size:10pt; margin-bottom:5mm; }
.page { page-break-after:always; }
.page:last-child { page-break-after:auto; }
table { width:100%; border-collapse:collapse; font-size:8.8pt; }
th { background:#111827; color:#fff; text-align:left; padding:1.6mm 2mm;
     font-weight:600; font-size:8.2pt; }
td { padding:1.6mm 2mm; border-bottom:1px solid #e5e7eb; vertical-align:top; }
tr:nth-child(even) td { background:#f8fafc; }
td.n { width:7mm; color:#6b7280; }
td.c { width:12mm; text-align:center; white-space:nowrap; }
td.note { color:#6b7280; font-size:8.2pt; }
.enc { border:1px solid #d1d5db; border-left:3px solid #1d4ed8;
       background:#f8fafc; padding:3mm 3.5mm; margin:4mm 0; }
.enc b { display:block; margin-bottom:1mm; }
.grid2 .enc:last-child { margin-bottom:0; }
.page > *:last-child { margin-bottom:0; }
.grid2 { display:flex; gap:5mm; }
.grid2 > div { flex:1; }
ul { margin:0 0 0 4mm; padding:0; }
li { margin-bottom:1mm; }

.fiche { border:1px solid #d1d5db; border-radius:2mm; padding:3.5mm;
         margin-bottom:4mm; font-size:8.8pt; line-height:1.4; break-inside:avoid; page-break-inside:avoid;
         display:flex; gap:4mm; }
.fiche .img { width:56mm; flex:0 0 56mm; }
.fiche .img svg { width:100%; height:auto; background:#f8fafc;
                  border:1px solid #e5e7eb; border-radius:1.5mm; }
.fiche .txt { flex:1; }
.tete { display:flex; align-items:baseline; gap:2mm; margin-bottom:1.5mm; }
.num { background:#111827; color:#fff; border-radius:50%; width:6mm; height:6mm;
       display:inline-flex; align-items:center; justify-content:center;
       font-size:8pt; font-weight:700; flex:0 0 6mm; }
.nom { font-size:11pt; font-weight:700; line-height:1.15; }
.badge { font-size:7.4pt; font-weight:700; color:#fff; padding:.6mm 2mm;
         border-radius:1mm; white-space:nowrap; }
.bloc { margin-bottom:2.2mm; }
.bloc b { font-size:8.2pt; text-transform:uppercase; letter-spacing:.3pt;
          color:#374151; }
.bloc ol { margin:.5mm 0 0 4.5mm; padding:0; }
.bloc ol li { margin-bottom:.6mm; }
.bloc .err li { color:#b91c1c; }
.leg { display:flex; gap:4mm; align-items:center; }
.leg .k { display:flex; align-items:center; gap:1.5mm; font-size:8.6pt; }
.k i { display:inline-block; width:9mm; height:0; border-top:3px solid #1f2937; }
.k i.g { border-top-color:#b6bec9; }
.k i.r { border-top:3px solid #dc2626; }
.pied { margin-top:4mm; font-size:8pt; color:#6b7280; }
"""


def esc(t):
    return H.escape(t, quote=False)


def fiche_html(f, n):
    c = COULEUR[f["groupe"]]
    etapes = "".join(f"<li>{esc(e)}</li>" for e in f["etapes"])
    erreurs = "".join(f"<li>{esc(e)}</li>" for e in f["erreurs"])
    return f"""
<div class="fiche">
  <div class="img">{ILLUS[f.get('illu', f['id'])]().svg()}</div>
  <div class="txt">
    <div class="tete"><span class="num">{n}</span>
      <span class="nom">{esc(f['nom'])}</span>
      <span class="badge" style="background:{c}">{esc(f['groupe'])}</span></div>
    <div class="bloc"><b>Quelle machine</b><div>{esc(f['machine'])}</div></div>
    <div class="bloc"><b>Réglages avant de commencer</b><div>{esc(f['reglage'])}</div></div>
    <div class="bloc"><b>Exécution</b><ol>{etapes}</ol></div>
    <div class="bloc"><b>Erreurs à éviter</b><ol class="err">{erreurs}</ol></div>
  </div>
</div>"""


def table_seance(titre, soustitre, lignes):
    rows = ""
    for i, (fid, nom, series, reps, repos, note) in enumerate(lignes, 1):
        rows += (f"<tr><td class='n'>{i}</td><td><b>{esc(nom)}</b><br>"
                 f"<span class='note'>{esc(note)}</span></td>"
                 f"<td class='c'>{series}</td><td class='c'>{esc(reps)}</td>"
                 f"<td class='c'>{esc(repos)}</td>"
                 f"<td class='c'>n° {IDX[fid]}</td></tr>")
    return f"""
<h3>{esc(titre)}</h3>
<p class="note" style="color:#6b7280;margin-bottom:1.5mm">{esc(soustitre)}</p>
<table><tr><th></th><th>Exercice</th><th>Séries</th><th>Répétitions</th>
<th>Repos</th><th>Fiche</th></tr>{rows}</table>"""


def table_bloc(titre, soustitre, lignes):
    rows = ""
    for fid, nom, series, reps, repos in lignes:
        rows += (f"<tr><td><b>{esc(nom)}</b></td><td class='c'>{series}</td>"
                 f"<td class='c'>{esc(reps)}</td><td class='c'>{esc(repos)}</td>"
                 f"<td class='c'>n° {IDX[fid]}</td></tr>")
    return f"""
<h3>{esc(titre)}</h3>
<p class="note" style="color:#6b7280;margin-bottom:1.5mm">{esc(soustitre)}</p>
<table><tr><th>Exercice</th><th>Séries</th><th>Durée / répétitions</th>
<th>Repos</th><th>Fiche</th></tr>{rows}</table>"""


def page_garde():
    sem = "".join(f"<tr><td><b>{j}</b></td><td>{esc(s)}</td><td class='c'>{d}</td></tr>"
                  for j, s, d in SEMAINE)
    exemple = ILLUS["developpe_couche"]().svg()
    return f"""
<div class="page">
<h1>Programme de musculation du soir</h1>
<p class="sub">Épaules · Dos · Pectoraux · Abdominaux — 4 séances par semaine, du lundi au vendredi.
Deux programmes alternent d'une semaine sur l'autre. Le cardio du matin (tapis roulant) n'est pas
repris ici.</p>

<div class="enc" style="margin:0 0 5mm"><b>Programme A et programme B : par blocs de 4 à 5 semaines</b>
Mêmes jours, mêmes muscles, mêmes volumes : seuls les exercices changent. Tu suis le programme A
pendant 4 à 5 semaines, puis le programme B pendant 4 à 5 semaines, et ainsi de suite. Ne les
alterne pas chaque semaine : répéter le même exercice plusieurs séances de suite est précisément
ce qui permet d'augmenter les charges, et c'est l'augmentation des charges qui fait progresser —
pas la variété. Le changement de bloc sert à éviter la lassitude et à varier les angles de
travail.</div>

<h2>La semaine (identique dans les deux programmes)</h2>
<table><tr><th>Jour</th><th>Séance du soir</th><th>Durée</th></tr>{sem}</table>

<h2 style="margin-top:7mm">Comment lire les fiches</h2>
<div class="grid2">
  <div style="flex:0 0 62mm">{exemple}</div>
  <div>
    <div class="leg" style="flex-direction:column;align-items:flex-start;gap:1.5mm">
      <div class="k"><i></i> Position de départ (trait foncé)</div>
      <div class="k"><i class="g"></i> Position d'arrivée (trait clair)</div>
      <div class="k"><i class="r"></i> Sens du mouvement</div>
    </div>
    <p style="margin-top:3mm">Chaque fiche indique la machine à chercher, les réglages à faire
    avant de commencer, l'exécution étape par étape et les erreurs fréquentes. Les numéros de
    fiche sont repris dans les tableaux de séance.</p>
  </div>
</div>

<h2 style="margin-top:6mm">Le matériel que tu vas croiser</h2>
<div class="grid2">
 <div>
  <div class="enc"><b>Colonne à poulie</b>Un montant vertical avec un câble. La poignée
  s'accroche en haut ou en bas selon l'exercice : premier réglage à vérifier.</div>
  <div class="enc"><b>Pile de plaques et goupille</b>Sur les machines guidées, la charge se
  choisit en enfonçant la goupille à fond dans la plaque voulue.</div>
  <div class="enc"><b>Rack et Smith machine</b>Le rack tient une barre libre sur deux crochets
  réglables ; la Smith machine la guide sur des rails.</div>
 </div>
 <div>
  <div class="enc"><b>Banc inclinable</b>Le dossier se règle cran par cran ; « 30° » correspond
  au premier ou au deuxième cran à partir de l'horizontale.</div>
  <div class="enc"><b>Chaise romaine</b>Le cadre vertical à coudières : on s'y suspend par
  les avant-bras pour les relevés de jambes.</div>
 </div>
</div>
</div>
<div class="page">
<h2>Les règles qui valent pour toutes les séances</h2>
<div class="grid2">
 <div>
  <div class="enc"><b>Échauffement (5 à 8 min)</b>
   5 min de vélo ou de rameur, puis 2 × 15 rotations d'épaules avec un élastique
   (rotations externes et tirage au visage). Sur le premier exercice, fais toujours
   1 à 2 séries d'approche à charge légère avant les séries indiquées.</div>
  <div class="enc"><b>Tempo</b>
   2 secondes sur la phase de descente (le muscle s'allonge), 1 seconde de pause,
   puis remontée franche mais contrôlée. Souffle sur l'effort.</div>
  <div class="enc"><b>Progression</b>
   Garde la même charge tant que tu n'atteins pas le haut de la fourchette de
   répétitions sur toutes les séries, avec une exécution propre. Ensuite, ajoute
   2,5 kg (ou passe à l'haltère supérieur) et repars en bas de la fourchette.</div>
 </div>
 <div>
  <div class="enc"><b>Si une machine est occupée</b>
   Prends l'exercice suivant de la liste et reviens ensuite, ou utilise
   l'alternative indiquée sur la fiche. L'ordre n'est important que pour le premier
   exercice, qui doit rester le plus lourd de la séance.</div>
  <div class="enc"><b>Sécurité</b>
   Colliers de serrage systématiques sur les barres. En cas de doute sur un réglage,
   demande au coach de salle : c'est son travail, et une machine mal réglée est la
   première cause de douleur. Une douleur articulaire (pas musculaire) = on arrête
   l'exercice.</div>
  <div class="enc"><b>Autour de la séance</b>
   Collation protéinée 1 h 30 à 2 h avant, apport de protéines dans l'heure qui suit.
   Termine au moins 1 h 30 avant le coucher. Le cardio du matin doit rester en
   endurance : pas de fractionné intense le matin d'une séance lourde.</div>
 </div>
</div>
<div class="enc" style="margin-top:4mm"><b>Et le bas du corps ?</b>
Ce programme ne travaille volontairement que le haut du corps, comme demandé. Le cardio
du matin sollicite les jambes en endurance, mais pas en force. Si un jour tu veux
rééquilibrer, une seule séance jambes hebdomadaire (presse, fentes, mollets) suffirait —
elle prendrait la place du mercredi ou du samedi.</div>
</div>"""


def table_gainage(gainage):
    rows = ""
    for seance, (fid, nom, series, duree, repos) in gainage.items():
        rows += (f"<tr><td class='c'><b>{seance}</b></td><td><b>{esc(nom)}</b></td>"
                 f"<td class='c'>{series}</td><td class='c'>{esc(duree)}</td>"
                 f"<td class='c'>{esc(repos)}</td><td class='c'>n° {IDX[fid]}</td></tr>")
    return f"""
<h3>Le gainage de fin de séance</h3>
<p class="note" style="color:#6b7280;margin-bottom:1.5mm">2 à 3 min, après le bloc
abdominal, tous les jours d'entraînement</p>
<table><tr><th>Séance</th><th>Exercice</th><th>Séries</th><th>Durée</th>
<th>Repos</th><th>Fiche</th></tr>{rows}</table>"""


def page_seances(prog):
    t = "".join(table_seance(*s) for s in prog["seances"][:2])
    t2 = "".join(table_seance(*s) for s in prog["seances"][2:])
    b = "".join(table_bloc(*x) for x in prog["blocs"])
    nom = esc(prog["titre"]) + " — " + esc(prog["sous"])
    return f"""
<div class="page"><p class="eyebrow">{nom}</p><h2>Les quatre séances</h2>{t}</div>
<div class="page"><p class="eyebrow">{nom}</p><h2>Les quatre séances (suite)</h2>{t2}</div>
<div class="page"><p class="eyebrow">{nom}</p><h2>Les blocs abdominaux</h2>
<p class="sub">À enchaîner en fin de séance, dans l'ordre. Chaque
séance a son bloc : deux exercices, trois séries chacun, soit 5 à 6 min. Le volume est
volontairement contenu — les abdominaux ne répondent pas mieux au volume que les autres muscles,
et des abdominaux visibles se gagnent dans l'assiette, pas en séries supplémentaires. Chaque
séance se termine par 2 à 3 min de gainage, qui protègent le bas du dos sollicité par les
mouvements dynamiques.</p>{b}{table_gainage(prog["gainage"])}
<div class="enc" style="margin-top:6mm"><b>Comment choisir son niveau</b>
La bonne version d'un exercice est celle où tu tiens les répétitions demandées sans que
le bas du dos se creuse. Dès que la position se dégrade, la série est finie : passe à la
régression indiquée sur la fiche (genoux fléchis, amplitude réduite, moins de charge).
C'est une étape normale de la progression, pas un échec.</div>
</div>"""


def page_fiches():
    out, groupe = [], None
    for f in FICHES:
        if f["groupe"] != groupe:
            if groupe is not None:
                out.append("</div>")
            groupe = f["groupe"]
            out.append(f'<div class="page"><h2>Fiches — {esc(groupe)}</h2>')
        out.append(fiche_html(f, IDX[f["id"]]))
    out.append("</div>")
    return "".join(out)


def page_suivi():
    lignes = "".join(
        "<tr><td style='height:7.5mm'></td><td></td><td></td><td></td><td></td><td></td></tr>"
        for _ in range(16))
    return f"""
<div class="page">
<h2>Carnet de suivi</h2>
<p class="sub">Note la charge utilisée et le nombre de répétitions réellement réalisées.
C'est ce qui permet de savoir quand augmenter : sans trace écrite, on stagne sans s'en
rendre compte.</p>
<table><tr><th>Date</th><th>Séance</th><th>Exercice</th><th>Charge</th>
<th>Répétitions</th><th>Ressenti</th></tr>{lignes}</table>
<div class="enc" style="margin-top:6mm"><b>Repères de progression</b>
Semaines 1 et 2 : apprendre les mouvements, charges volontairement légères.
Semaines 3 à 6 : monter progressivement jusqu'au haut des fourchettes de répétitions.
Semaine 7 : semaine allégée (mêmes exercices, une série de moins) avant de repartir.</div>
<p class="pied">Programme établi le 21/09/2026 — à ajuster selon le matériel disponible dans ta salle.</p>
</div>"""


def main():
    seances = "".join(page_seances(p) for p in PROGRAMMES)
    doc = (f'<!doctype html><html lang="fr"><head><meta charset="utf-8">'
           f'<title>Programme de musculation du soir</title><style>{CSS}</style></head>'
           f'<body>{page_garde()}{seances}{page_fiches()}{page_suivi()}</body></html>')
    tmp = os.path.join(RACINE, "outils", "_programme.html")
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(doc)
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
                    "--no-pdf-header-footer", f"--print-to-pdf={SORTIE}",
                    "file://" + tmp], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("PDF ecrit :", SORTIE)
    return tmp


if __name__ == "__main__":
    main()
