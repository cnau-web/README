# Installer OndeTV sur iPhone/iPad avec TestFlight (sans ordinateur)

Tout se fait depuis Safari sur l'iPhone. Compte Apple Developer requis (99 €/an).

## 1. Compte Apple Developer
App **Apple Developer** (App Store) → *Compte* → **S'inscrire** → particulier → payer 99 €.
Validation : de quelques heures à 2 jours.

## 2. Identifiant de l'app
Safari → https://developer.apple.com/account/resources/identifiers/list → **+**
→ *App IDs* → *App* → Description `OndeTV`, Bundle ID **Explicit** : `com.cnau.ondetv` → *Register*.

## 3. Fiche de l'app dans App Store Connect
https://appstoreconnect.apple.com → **Apps** → **+** → *Nouvelle app*
→ iOS, nom `OndeTV` (ou un autre nom libre), langue Français, Bundle ID `com.cnau.ondetv`, SKU `ondetv` → *Créer*.

## 4. Clé API (permet à GitHub de signer et d'envoyer l'app)
App Store Connect → **Utilisateurs et accès** → **Intégrations** → *Clés d'API App Store Connect* → **+**
→ nom `GitHub`, accès **Admin** → *Générer*.
Notez l'**Issuer ID** et l'**ID de la clé**, puis **Télécharger la clé** (`AuthKey_XXXX.p8`, téléchargeable une seule fois).
Pour copier son contenu : app Fichiers → appui long sur le fichier → *Renommer* en `AuthKey.txt` → l'ouvrir → tout sélectionner → *Copier*.

Team ID : https://developer.apple.com/account → *Membership details* → **Team ID** (10 caractères).

## 5. Secrets GitHub
https://github.com/cnau-web/README/settings/secrets/actions → **New repository secret**, quatre fois :

| Nom | Valeur |
|---|---|
| `APPLE_TEAM_ID` | Team ID |
| `ASC_KEY_ID` | ID de la clé |
| `ASC_ISSUER_ID` | Issuer ID |
| `ASC_KEY_P8` | tout le texte du fichier, lignes `-----BEGIN PRIVATE KEY-----` et `-----END PRIVATE KEY-----` comprises |

Autre Bundle ID qu'à l'étape 2 ? Ajoutez une *variable* (onglet Variables) `BUNDLE_ID`.

## 6. Lancer l'envoi
https://github.com/cnau-web/README/actions/workflows/ios-testflight.yml → **Run workflow** → branche `claude/ios-xtream-player` → *Run*.
Ensuite, chaque modification de l'app relance l'envoi automatiquement.

## 7. Installer
1. App **TestFlight** (App Store) sur l'iPhone et l'iPad.
2. App Store Connect → OndeTV → **TestFlight** → *Testeurs internes* → **+** → créez un groupe et ajoutez-vous (votre identifiant Apple).
3. Après 10 à 30 min de traitement, vous recevez l'invitation : ouvrez-la dans TestFlight → **Installer**.

Chaque build reste valable 90 jours ; un nouvel envoi la remplace.
