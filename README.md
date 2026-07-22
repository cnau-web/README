# Connecteur MCP Synology pour Claude

Ce projet transforme votre NAS Synology en **connecteur personnalisé Claude** : une fois
installé, Claude peut lister, rechercher et récupérer les fichiers de votre NAS
(File Station) directement depuis claude.ai — par exemple retrouver le dernier
contrat de syndic d'un dossier de copropriété.

Le serveur s'héberge **sur le NAS lui-même** via Docker (Container Manager) et
s'expose en HTTPS via le proxy inversé de DSM.

## Outils exposés à Claude

| Outil | Description |
|---|---|
| `list_shares` | Liste les dossiers partagés à la racine du NAS |
| `list_folder` | Liste le contenu d'un dossier (`/copro/0039 - ...`) |
| `search_files` | Recherche récursive par nom (`0039*`, `*contrat*syndic*`) |
| `get_file` | Télécharge un fichier (≤ 15 Mo) pour que Claude le lise |
| `share_link` | Crée un lien de partage temporaire vers un fichier |

## Installation

### 1. Créer un compte DSM dédié en lecture seule

1. DSM → **Panneau de configuration → Utilisateur et groupe → Créer**.
2. Nom : `claude-lecture`, mot de passe fort.
3. Autorisations : **lecture seule** uniquement sur les dossiers partagés utiles
   (ex. le dossier des copropriétés), **Aucun accès** partout ailleurs.
4. Applications : autoriser uniquement **File Station**.
5. **Ne pas activer la vérification en 2 étapes** sur ce compte (l'API ne la gère pas
   pour ce type de connexion) — c'est pour cela qu'on le limite en lecture seule.

### 2. Déployer le conteneur

1. Copiez ce dossier sur le NAS (par ex. dans `/volume1/docker/synology-mcp`).
2. Éditez `docker-compose.yml` :
   - `SYNO_URL` : `http://<IP-locale-du-NAS>:5000` (l'IP du NAS, pas `localhost`) ;
   - `SYNO_ACCOUNT` / `SYNO_PASSWORD` : le compte créé à l'étape 1 ;
   - `MCP_TOKEN` : un secret aléatoire d'au moins 24 caractères
     (`openssl rand -hex 24` — ce jeton fait partie de l'URL du connecteur, il sert de clé d'accès).
3. **Container Manager → Projet → Créer**, sélectionnez le dossier, lancez.
4. Vérifiez : `http://<IP-du-NAS>:8099/healthz` doit répondre `{"ok":true}`.

### 3. Exposer en HTTPS (proxy inversé DSM)

claude.ai exige une URL HTTPS publique avec un certificat valide.

1. Assurez-vous d'avoir un nom de domaine pour le NAS
   (DSM → **Accès externe → DDNS**, ex. `monnas.synology.me`) et un certificat
   Let's Encrypt associé (**Sécurité → Certificat**).
2. **Panneau de configuration → Portail de connexion → Avancé → Proxy inversé → Créer** :
   - Source : HTTPS, nom d'hôte `monnas.synology.me`, port `8443` ;
   - Destination : HTTP, `localhost`, port `8099`.
3. Ouvrez/redirigez le port `8443` sur votre box/routeur vers le NAS.
4. Test : `https://monnas.synology.me:8443/healthz` → `{"ok":true}`.

### 4. Ajouter le connecteur dans claude.ai

1. claude.ai → **Paramètres → Connecteurs → Ajouter un connecteur personnalisé**
   (sur un plan Pro/Max/Team ; pour un plan Team/Enterprise c'est un administrateur
   qui l'ajoute dans les paramètres d'organisation).
2. URL du serveur MCP :

   ```
   https://monnas.synology.me:8443/mcp/<votre MCP_TOKEN>
   ```

3. Enregistrez, puis activez le connecteur dans la conversation
   (menu des connecteurs du chat).

Ensuite, demandez par exemple à Claude :
> « Cherche dans le NAS le dossier 0039 et donne-moi son dernier contrat de syndic. »

## Sécurité

- Le jeton dans l'URL est la seule protection d'accès : gardez-le secret,
  choisissez-le long et aléatoire, et changez-le en cas de doute (puis mettez à
  jour l'URL du connecteur).
- Le compte DSM utilisé est en **lecture seule** et limité à File Station :
  même en cas de fuite du jeton, aucune modification/suppression n'est possible.
- Les liens créés par `share_link` sont publics jusqu'à expiration — utilisez
  une durée courte.
- Pensez à maintenir DSM et le conteneur à jour.

## Dépannage

- **401 unauthorized** : le jeton de l'URL ne correspond pas à `MCP_TOKEN`.
- **Échec de connexion DSM (code 400/402/403/404)** : identifiants invalides,
  compte désactivé, ou 2FA activée sur le compte.
- **Erreur API code 119/106** : session expirée — le serveur se reconnecte
  automatiquement ; si cela persiste, redémarrez le conteneur.
- **Claude ne voit pas le connecteur** : vérifiez que l'URL répond bien en HTTPS
  public (`/healthz`) et que le certificat est valide (pas d'auto-signé).
