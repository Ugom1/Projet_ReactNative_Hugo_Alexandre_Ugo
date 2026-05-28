# DreamTeam Maker ⚽

Application mobile **React Native (Expo)** — clicker football, gestion de DreamTeam (CRUD), joueurs via API-Football, backend **Firebase**.

Projet Firebase : `dreamteammaker-2298e`

## Prérequis

- Node.js 18+
- Compte [Expo](https://expo.dev) (optionnel)
- **Expo Go** sur téléphone (recommandé pour tester)
- Projet Firebase configuré (voir ci-dessous)

## Démarrage

```bash
cd dream-team-maker
npm install
npx expo start
```

| Commande | Usage |
|----------|--------|
| `npm start` | Serveur Expo + QR code |
| `npm run web` | Ouvrir dans le navigateur |
| `npm run android` | Émulateur / appareil Android |
| `npm run ios` | Simulateur iOS (macOS uniquement) |

Scanne le QR code avec **Expo Go**, ou appuie sur `w` (web) / `a` (Android) dans le terminal.

## Navigation

| Zone | Écrans |
|------|--------|
| **Auth** | Connexion, inscription, mot de passe oublié |
| **Clicker** | Tap ballon → coins, boutique de boosts |
| **DreamTeam** | Liste, création (formation + ligue), feuille de match, marché joueurs |
| **Ligue** | Simulation mini-saison (8 matchs) |
| **Profil** | Photo, pseudo, mot de passe, succès, compte |

## Exigences cours (couvertes)

| Exigence | Implémentation |
|----------|----------------|
| Expo + TypeScript | Expo SDK 56, template Expo Router |
| Expo Router | `app/(auth)`, `app/(tabs)`, `app/team` |
| 2 collections Firestore | `users`, `dreamTeams` |
| CRUD (2 entités) | DreamTeam (C/R/U/D) + profil utilisateur (R/U/D) |
| TanStack Query | Cache API-Football (`app/team/player-market.tsx`) |
| Zod | `lib/schemas.ts` |
| API externe | API-Football — Premier League & La Liga |
| Firebase Auth | Email/mot de passe, reset, œil sur le champ password |

## Configuration Firebase

Dans [Firebase Console](https://console.firebase.google.com/) → projet **dreamteammaker-2298e** :

1. **Authentication** → activer **Email/Password**
2. **Firestore Database** → créer la base
3. **Règles** → copier le fichier [`firestore.rules`](./firestore.rules) → **Publier**
4. **Storage** → activer (avatars sur mobile)

Règles Storage (exemple) :

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}.jpg {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

La config SDK est dans `lib/firebase.ts` (déjà renseignée pour ce projet).

## API Football

- Clé : `lib/constants.ts` (`API_FOOTBALL_KEY`)
- Ligues : Premier League (39), La Liga (140)
- Cache local 24 h (AsyncStorage) — plan gratuit ~**100 requêtes/jour**
- Sur le marché joueurs : bouton **« Précharger 4 clubs »** avant d’explorer les effectifs

## Collections Firestore

| Collection | Contenu |
|------------|---------|
| `users` | coins, xp, clics, boosts, achievements, profil, `photoURL` |
| `dreamTeams` | nom, formation, ligue, tableau `players` (slots) |

## Web vs mobile

| Plateforme | Recommandation |
|------------|----------------|
| **Expo Go (téléphone)** | ✅ Comportement complet (Firestore + Storage) |
| **Navigateur (`localhost:8081`)** | Dev uniquement — limitations ci-dessous |

### Navigateur — points d’attention

1. **Bloqueur de pub** (uBlock, AdBlock…)  
   Bloque `firestore.googleapis.com` → coins / équipe ne se sauvent pas.  
   → Désactive le bloqueur pour `localhost:8081` **ou** utilise Expo Go.

2. **Photo de profil**  
   Sur le web, la photo est stockée dans **Firestore** (data URL), pas Storage (évite CORS).  
   Sur mobile : **Firebase Storage** (`avatars/{uid}.jpg`).

3. **Storage CORS (optionnel, pour le web)**  
   Fichier [`storage.cors.json`](./storage.cors.json), avec [Google Cloud SDK](https://cloud.google.com/sdk) :

   ```bash
   gsutil cors set storage.cors.json gs://dreamteammaker-2298e.firebasestorage.app
   ```

## Structure du projet

```
app/
  (auth)/          login, signup, forgot-password
  (tabs)/          clicker, team, league, profile
  team/            create, [id]/sheet, [id]/edit, player-market
lib/               firebase, schemas, api-football, simulator
services/          userService, teamService
providers/         AuthProvider, QueryProvider
components/        PasswordInput, PitchView, FormError, …
```

## Dépannage rapide

| Problème | Solution |
|----------|----------|
| Inscription 400 / rien ne se passe | Activer Email/Password dans Firebase Auth ; lire le bandeau rouge sur l’écran |
| Coins = `NaN` | Reconnecte-toi (réparation auto du profil) |
| Coins ne montent pas (web) | Désactiver AdBlock pour localhost |
| Joueur sans déduction de coins | Vérifier Firestore non bloqué ; message d’erreur sur le marché |
| Photo de profil (web) | Utiliser une image légère ; ou tester sur Expo Go |

## Arrêter le serveur

`Ctrl+C` dans le terminal où tourne `npx expo start`.
