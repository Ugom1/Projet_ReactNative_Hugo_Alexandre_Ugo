import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig, getFirebaseSetupMessage, isFirebaseConfigured } from '@/lib/firebase-config';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(getFirebaseSetupMessage());
  }
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
  }
  return auth;
}

export function getDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getApp());
  }
  return firestore;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getApp());
  }
  return storage;
}

export { isFirebaseConfigured, getFirebaseSetupMessage };
