/**
 * Migre cards/{cardId}/owners → users/{uid}/collection
 * Usage : npm run migrate:collection dyl123@gmail.com motdepasse
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from 'firebase/firestore';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const envPath = resolve(root, '.env');
const MARKER = 'dtm_catalog_synced';

function loadEnv() {
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const email = cliArgs[0] || 'dyl123@gmail.com';
const password = cliArgs[1] || process.env.DTM_PASSWORD || '';

if (!existsSync(envPath) || !password) {
  console.error('Usage: npm run migrate:collection email motdepasse');
  process.exit(1);
}

const env = loadEnv();
const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);
const auth = getAuth(app);

async function main() {
  await signInWithEmailAndPassword(auth, email, password);
  const uid = auth.currentUser.uid;
  console.log(`🔄 Migration owners → users/${uid}/collection`);

  const cardsSnap = await getDocs(collection(db, 'cards'));
  let migrated = 0;
  let batch = writeBatch(db);
  let ops = 0;

  for (const cardDoc of cardsSnap.docs) {
    if (cardDoc.id === MARKER) continue;
    const ownersSnap = await getDocs(collection(db, 'cards', cardDoc.id, 'owners'));
    for (const ownerDoc of ownersSnap.docs) {
      const data = ownerDoc.data();
      if (data.uid !== uid) continue;
      batch.set(doc(db, 'users', uid, 'collection', ownerDoc.id), {
        cardId: String(data.cardId ?? cardDoc.id),
        rarete: data.rarete,
        obtainedAt: data.obtainedAt,
        catalogOwnerId: ownerDoc.id,
      });
      migrated++;
      ops++;
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    }
  }

  if (ops > 0) await batch.commit();
  console.log(`✅ ${migrated} carte(s) migrée(s) vers users/.../collection`);
}

main().catch((err) => {
  console.error('❌', err.code || err.message || err);
  process.exit(1);
});
