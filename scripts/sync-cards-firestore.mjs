/**
 * Envoie le catalogue joueurs vers Firestore collection `cards/`
 * Usage : npm run sync:cards [email] [password]
 *
 * Prérequis : règles Firestore publiées (firestore.rules avec match /cards)
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
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '..');
const envPath = resolve(root, '.env');
const playersPath = resolve(root, 'data/fc26.players.generated.ts');
const MARKER_ID = 'dtm_catalog_synced';
const MIN_NOTE = 75;
const MAX_NOTE = 91;
const MARKER_IDS = new Set([MARKER_ID]);

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('❌ .env introuvable');
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

function cardNote(data) {
  return Number(data.note ?? data.ovr ?? 0);
}

function isInRange(note) {
  return note >= MIN_NOTE && note <= MAX_NOTE;
}

function loadPlayers() {
  const raw = readFileSync(playersPath, 'utf8');
  const match = raw.match(/export const FC26_PLAYERS = (\[[\s\S]*?\]) as const;/);
  if (!match) throw new Error('FC26_PLAYERS introuvable — npm run sync:players');
  return JSON.parse(match[1])
    .map((p) => ({
      cardId: String(p.apiId ?? p.nom.toLowerCase().replace(/\s+/g, '-')),
      apiId: p.apiId,
      nom: p.nom,
      position: p.position,
      ligue: p.ligue,
      nationalite: p.nationalite,
      note: p.note ?? p.ovr,
      image: p.image,
    }))
    .filter((p) => isInRange(p.note));
}

const env = loadEnv();
const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const email = cliArgs[0] || 'dyl123@gmail.com';
const password = cliArgs[1] || process.env.DTM_PASSWORD || '';

if (!env.EXPO_PUBLIC_FIREBASE_API_KEY) {
  console.error('❌ EXPO_PUBLIC_FIREBASE_API_KEY manquant dans .env');
  process.exit(1);
}

if (!password) {
  console.error('❌ Mot de passe requis : npm run sync:cards email motdepasse');
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'dreamteammaker-a6bf0',
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});

const db = getFirestore(app);
const auth = getAuth(app);

async function purgeOutOfRangeCards() {
  const snap = await getDocs(collection(db, 'cards'));
  let deleted = 0;
  let batch = writeBatch(db);
  let ops = 0;

  for (const d of snap.docs) {
    if (MARKER_IDS.has(d.id)) continue;
    const note = cardNote(d.data());
    if (isInRange(note)) continue;

    batch.delete(d.ref);
    deleted++;
    ops++;

    if (ops >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  return deleted;
}

function isPermissionError(err) {
  const code = String(err?.code ?? '');
  const msg = String(err?.message ?? '');
  return code.includes('permission') || msg.includes('permission') || msg.includes('PERMISSION_DENIED');
}

function printRulesHelp() {
  console.warn('');
  console.warn('📋 Publie les règles Firestore (obligatoire) :');
  console.warn('   https://console.firebase.google.com/project/dreamteammaker-a6bf0/firestore/rules');
  console.warn('   → Copie le fichier firestore.rules du projet → Publier');
  console.warn('');
}

async function main() {
  const skipPurge = process.argv.includes('--skip-purge');
  const players = loadPlayers();
  console.log(`🔥 Connexion ${email}…`);
  await signInWithEmailAndPassword(auth, email, password);

  if (skipPurge) {
    console.log('⏭ Purge ignorée (--skip-purge)');
  } else {
    console.log(`🗑 Suppression des cartes hors plage ${MIN_NOTE}–${MAX_NOTE}…`);
    try {
      const deleted = await purgeOutOfRangeCards();
      console.log(`   ${deleted} document(s) supprimé(s)`);
    } catch (err) {
      if (!isPermissionError(err)) throw err;
      console.warn('   ⚠️ Purge impossible (règles delete non publiées) — upload seul…');
      printRulesHelp();
    }
  }

  console.log(`⚽ Upload ${players.length} joueurs → cards/…`);

  const BATCH = 400;
  let written = 0;

  for (let i = 0; i < players.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const p of players.slice(i, i + BATCH)) {
      batch.set(doc(db, 'cards', p.cardId), p, { merge: true });
    }
    await batch.commit();
    written += Math.min(BATCH, players.length - i);
    console.log(`   ${written}/${players.length}`);
  }

  await setDoc(
    doc(db, 'cards', MARKER_ID),
    {
      syncedAt: serverTimestamp(),
      count: players.length,
      minNote: MIN_NOTE,
      maxNote: MAX_NOTE,
      source: 'sync-cards-firestore.mjs',
    },
    { merge: true }
  );

  console.log(`✅ Catalogue cards synchronisé (${players.length} joueurs, notes ${MIN_NOTE}–${MAX_NOTE})`);
  console.log('   → Rafraîchis la console Firebase (Firestore → Données)');
}

main().catch((err) => {
  console.error('❌ Échec:', err.code || err.message || err);
  if (isPermissionError(err)) {
    printRulesHelp();
    console.error('   Astuce : npm run sync:cards -- --skip-purge email motdepasse (upload sans purge)');
  }
  process.exit(1);
});
