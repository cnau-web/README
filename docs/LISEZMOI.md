# Carte des exercices — version installable

Ce dossier est publié tel quel par GitHub Pages : <https://cnau-web.github.io/README/>

| Fichier | Rôle |
|---|---|
| `index.html` | la carte complète, autonome (schémas, fiches, calendrier) |
| `manifest.webmanifest` | nom, icônes et mode plein écran de l'application |
| `sw.js` | service worker : met tout en cache pour l'usage hors réseau |
| `icone-*.png` | icônes d'écran d'accueil (192, 512 et 180 px pour iOS) |
| `.nojekyll` | désactive le traitement Jekyll de GitHub Pages |

**Ne pas modifier ces fichiers à la main :** ils sont régénérés par
`python3 outils/generer_carte.py`, qui écrit à la fois `carte-exercices.html`
(version artefact) et ce dossier.

## Activer la publication

Réglages du dépôt → **Pages** → Source : *Deploy from a branch* →
branche `claude/programme-musculation-soir-t5hbrj`, dossier `/docs` → *Save*.

## Installer sur le téléphone

Ouvrir l'adresse ci-dessus, puis « Sur l'écran d'accueil » (Safari) ou
« Installer l'application » (Chrome). Une fois installée, l'application s'ouvre
sans réseau ; quand une nouvelle version est publiée, une bannière propose de
recharger.
