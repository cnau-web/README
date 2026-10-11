# OndeTV — version web

Lecteur IPTV Xtream Codes utilisable dans Safari sur iPhone/iPad, ajoutable à l'écran d'accueil.
Aucune app à installer, aucun compte développeur Apple.

- `public/` : l'application (HTML/CSS/JS sans dépendance ; hls.js chargé seulement hors Safari).
- `proxy.js` : relais HTTPS → serveur Xtream (les serveurs IPTV sont souvent en HTTP, ce que Safari bloque
  depuis une page HTTPS). Les playlists HLS sont réécrites pour que les segments passent aussi par le relais ;
  ces URL sont signées (HMAC) pour que le relais ne serve pas de proxy ouvert.
- `main.js` : serveur (Deno) qui sert `public/` et le relais `/x`.

## Mettre en ligne (Render, gratuit)

Ouvrir : https://render.com/deploy?repo=https://github.com/cnau-web/README/tree/claude/ios-xtream-player
→ créer un compte → **Deploy Blueprint**. L'adresse obtenue (`https://ondetv-xxxx.onrender.com`) est l'app.

L'offre gratuite met le service en veille après 15 min sans visite : la première ouverture prend alors ~1 minute.

## En local

```bash
deno run -A web/main.js   # http://localhost:8000
```

Variables : `PROXY_SECRET` (clé de signature, à définir en production), `UPSTREAM_USER_AGENT`, `PORT`.

## Limites

- Lecture : HLS (direct, replay) et MP4. Le MKV/AVI n'est pas lu par les navigateurs.
- Tout le flux vidéo transite par le relais : la bande passante de l'hébergeur s'applique.
- Certains fournisseurs IPTV bloquent les adresses IP de centres de données.
