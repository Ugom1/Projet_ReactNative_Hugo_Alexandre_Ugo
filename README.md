# DTM — Dream Team Maker

Application mobile React Native / Expo — collecte de cartes, clicker, composition d'équipe et packs.

## Stack

- Expo SDK 56 + expo-router
- Firebase Auth + Firestore
- TanStack Query + Zod
- TypeScript

## Configuration Firebase (dreamteammaker-a6bf0)

Console : [dreamteammaker-a6bf0](https://console.firebase.google.com/project/dreamteammaker-a6bf0/overview)

1. **Authentication** → Sign-in method → activer **Email/Password**
2. **Firestore** → Create database (mode test, région europe-west)
3. **Paramètres projet** (⚙️) → **Vos applications** → ajouter une app **Web** `</>`
4. Copier les clés dans `.env` :

```bash
cp .env.example .env
# Remplir EXPO_PUBLIC_FIREBASE_API_KEY, MESSAGING_SENDER_ID, APP_ID
```

5. Déployer les règles :

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project dreamteammaker-a6bf0
```

6. Tester la connexion :

```bash
node scripts/test-firebase.mjs test@dtm.app Test123456
npx expo start -c
```

## Joueurs EA FC 26 (API msmc.cc)

Les cartes proviennent de l'API [EA FC 26](https://api.msmc.cc/fc26/) — **aucune clé requise**.

```bash
npm run sync:players
```

Cela régénère `data/fc26.players.generated.ts` (joueurs par nation, photos EA, **note fixe** = OVR EA).

## Probabilités des packs

Chaque joueur a une **note permanente**. À l'ouverture d'un pack :
1. Tirage d'une **tranche de note** (selon le pack)
2. Tirage **uniforme** d'un joueur dans cette tranche

```bash
npm run pack:stats
```

Affiche le tableau des probabilités, l'effectif par tranche et une simulation Monte Carlo.

## Lancer l'app

```bash
npx expo start
```

Scanner le QR code avec **Expo Go**.

## Build EAS (APK Android)

```bash
npx expo-doctor
eas build --profile preview --platform android
```

## Fonctionnalités

| Écran | Description |
|-------|-------------|
| Auth | Login, inscription, mot de passe oublié, Google |
| Accueil | Clicker + upgrade |
| Jouer | Paliers 75→95 + composition + résultat match |
| Marché | 4 packs + ouverture animée |
| Ma Galerie | Collection avec filtres + vente (DELETE) |

## Collections Firestore

À la **racine** de la BDD (même niveau que `users`) :

- `cards/{cardId}` — fiche joueur (nom, note, photo, poste…)
- `cards/{cardId}/owners/{ownershipId}` — qui possède la carte (`uid`, rareté, date)
- `users/{uid}` — profil, monnaie, palier
- `users/{uid}/composition/current` — brouillon
- `users/{uid}/matchHistory/{matchId}` — historique

Quand un compte ouvre un pack, un document est créé dans `cards/{cardId}/owners/`. Plusieurs comptes peuvent posséder la même carte (plusieurs docs `owners` sur le même `cardId`).

### Créer la collection `cards` (obligatoire une fois)

1. **Publier les règles** Firestore (console → Règles → coller `firestore.rules` → Publier)
2. Lancer depuis le terminal :

```bash
npm run sync:cards ton@email.com tonMotDePasse
```

Rafraîchir la console Firebase : la collection `cards` (~4200 documents) apparaît.

## Critères cours Hexagone

- CRUD sur 2+ entités liées ✓
- TanStack Query (loading/error/data) ✓
- Zod validation ✓
- SafeAreaView + KeyboardAvoidingView ✓
- EAS Build ready ✓
- Auth Firebase + onSnapshot realtime ✓
