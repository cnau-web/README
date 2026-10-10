# OndeTV — lecteur IPTV Xtream Codes pour iPhone et iPad

Application iOS native (Swift / SwiftUI) inspirée de l'ergonomie des lecteurs IPTV de salon :
direct avec zapping, guide TV, replay, films et séries, favoris et reprise de lecture.
OndeTV est **un lecteur** : il ne fournit aucun contenu, il se connecte à votre abonnement Xtream Codes.

## Fonctionnalités

| Domaine | Détail |
|---|---|
| **Connexion** | Serveur + identifiant + mot de passe Xtream Codes, plusieurs playlists, mot de passe stocké dans le trousseau iOS |
| **Direct** | iPad : 3 colonnes (catégories / chaînes / aperçu vidéo + programme). iPhone : toucher une chaîne = plein écran |
| **Plein écran direct** | Zapping par glissement haut/bas ou boutons, bandeau « en cours / ensuite », liste des chaînes latérale, double-tap = recadrage, PiP, AirPlay |
| **Guide TV** | Grille horaire (-30 min → +8 h), ligne « maintenant », par catégorie ou favoris, fiche programme |
| **Replay (catch-up)** | Programmes passés lisibles sur les chaînes avec archive (`tv_archive`) |
| **Films** | Catégories, recherche, fiche (synopsis, casting, note, bande-annonce), reprise de lecture |
| **Séries** | Saisons / épisodes, « Reprendre SxEy », épisodes vus |
| **Favoris / récents** | Chaînes (réordonnables), films, séries — par compte |
| **Lecteur VLC intégré** | MKV, AVI, MPEG-TS… lus dans l'app via VLCKit : sauts ±10/30 s, barre de progression, choix des pistes audio et sous-titres, reprise |
| **Choix du lecteur** | Automatique (lecteur iOS pour MP4/HLS, VLC pour le reste, bascule sur VLC si iOS échoue), ou forcé : VLC intégré, lecteur iOS, app VLC, app Infuse |

## Compiler et installer

Prérequis : un Mac avec **Xcode 16**, [XcodeGen](https://github.com/yonaskolb/XcodeGen) et [CocoaPods](https://cocoapods.org).

```bash
brew install xcodegen cocoapods
cd ios
xcodegen generate        # crée OndeTV.xcodeproj puis lance « pod install » (MobileVLCKit, ~230 Mo)
open OndeTV.xcworkspace  # ⚠️ ouvrir le .xcworkspace, pas le .xcodeproj
```

Sans `pod install`, l'app compile quand même (VLC intégré désactivé, repli sur les apps VLC/Infuse).

Dans Xcode : cible **OndeTV** → *Signing & Capabilities* → choisir votre *Team*
(un identifiant Apple gratuit suffit pour installer sur votre propre appareil, valable 7 jours),
brancher l'iPhone/iPad puis ▶︎ *Run*. Modifiez au besoin `PRODUCT_BUNDLE_IDENTIFIER` dans `project.yml`.

### Tests du module réseau

Le module `Packages/XtreamKit` (API Xtream, décodage, URLs de lecture) se teste sans simulateur :

```bash
cd ios/Packages/XtreamKit
swift test
```

## Architecture

```
ios/
├── project.yml                  # Spécification XcodeGen
├── Podfile                      # MobileVLCKit (pod officiel VideoLAN)
├── Packages/XtreamKit/          # Module Swift indépendant de l'UI
│   ├── Sources/XtreamKit/
│   │   ├── XtreamClient.swift   # player_api.php, URLs live / movie / series / timeshift
│   │   ├── Models.swift         # Catégories, chaînes, films, séries, épisodes, EPG
│   │   └── LenientDecoding.swift# Décodage tolérant (nombres en chaîne, [] au lieu de {}, base64 EPG…)
│   └── Tests/
└── OndeTV/
    ├── App/                     # Point d'entrée, AppModel (comptes, session)
    ├── Services/                # ContentStore (cache + EPG), LibraryStore (favoris, reprise), Keychain
    └── Views/
        ├── Live/                # Catégories, liste des chaînes, fiche chaîne + aperçu
        ├── Guide/               # Grille EPG
        ├── VOD/ Series/         # Catalogues et fiches
        ├── Player/              # AVPlayer partagé, plein écran direct, AVPlayerViewController, lecteur VLCKit
        └── Settings/
```

Points techniques :

- **Un seul `AVPlayer`** partagé entre l'aperçu (iPad / fiche chaîne) et le plein écran : pas de rechargement du flux en passant en plein écran.
- Le direct est demandé en **HLS** (`/live/user/pass/id.m3u8`), seul format de flux en direct lu nativement par iOS.
- Replay : `/timeshift/user/pass/<durée>/<AAAA-MM-JJ:HH-MM>/<id>.m3u8`, heure exprimée dans le fuseau du serveur (`server_info.timezone`).
- L'EPG court (`get_short_epg`) est chargé à la demande, ligne par ligne, avec un cache de 15 min et 6 requêtes simultanées au maximum.

## Limites connues / pistes

- Le lecteur VLC intégré ne gère pas le PiP ni AirPlay vidéo (limites de VLCKit 3) ; le lecteur iOS reste utilisé pour le MP4/HLS.
- VLCKit est sous licence **LGPL 2.1** : une diffusion sur l'App Store impose d'en respecter les conditions (VLC pour iOS le fait en publiant son code).
- Pas encore d'import M3U ni d'EPG XMLTV externe (uniquement Xtream Codes).
- Pas de version Apple TV (tvOS) : la base `XtreamKit` est déjà compatible tvOS.
- Distribution App Store : Apple examine de près les lecteurs IPTV ; l'app ne doit pas être livrée avec du contenu ou des playlists préconfigurées.
