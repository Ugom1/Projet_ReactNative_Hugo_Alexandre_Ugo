import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA5QPoSdish6oxQCdQxUldLj7D0wumXpLs',
  authDomain: 'dreamteammaker-2298e.firebaseapp.com',
  databaseURL: 'https://dreamteammaker-2298e-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'dreamteammaker-2298e',
  storageBucket: 'dreamteammaker-2298e.firebasestorage.app',
  messagingSenderId: '539543969622',
  appId: '1:539543969622:web:4edc2259ae0752e54e40f7',
  measurementId: 'G-V8FSQF6H9X',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
