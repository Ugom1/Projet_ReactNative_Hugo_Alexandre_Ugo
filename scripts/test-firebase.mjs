/**
 * Test Firebase Auth + Firestore pour dreamteammaker-a6bf0
 * Usage : node scripts/test-firebase.mjs [email] [password]
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env');

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('❌ Fichier .env introuvable. Copiez .env.example → .env et remplissez les clés Firebase.');
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

const env = loadEnv();
const apiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY;
const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'dreamteammaker-a6bf0';

if (!apiKey) {
  console.error('❌ EXPO_PUBLIC_FIREBASE_API_KEY manquant dans .env');
  console.error('   → https://console.firebase.google.com/project/dreamteammaker-a6bf0/settings/general');
  process.exit(1);
}

const email = process.argv[2] || 'test@dtm.app';
const password = process.argv[3] || 'Test123456';

async function signUp() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  return res.json();
}

console.log(`🔥 Test Firebase — projet ${projectId}`);
console.log(`📧 ${email}\n`);

let data = await signIn();
if (data.error?.message === 'EMAIL_NOT_FOUND') {
  console.log('Compte absent → création...');
  data = await signUp();
}

if (data.error) {
  console.error('❌ Erreur Auth:', data.error.message);
  if (data.error.message === 'CONFIGURATION_NOT_FOUND') {
    console.error('   → Activez Authentication → Email/Password dans la console Firebase.');
  }
  process.exit(1);
}

console.log('✅ Auth OK — uid:', data.localId);
console.log('✅ Projet Firebase connecté. Lancez l\'app : npx expo start -c');
