export const FIREBASE_PROJECT_ID = 'dreamteammaker-a6bf0';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.messagingSenderId);
}

export function getFirebaseSetupMessage() {
  return (
    'Firebase non configuré.\n\n' +
    '1. Console → dreamteammaker-a6bf0 → Paramètres → Vos applications\n' +
    '2. Ajoutez une app Web (</>) si besoin\n' +
    '3. Copiez les clés dans le fichier .env à la racine du projet\n' +
    '4. Relancez : npx expo start -c'
  );
}
