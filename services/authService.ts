import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db, firebaseAuth } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

WebBrowser.maybeCompleteAuthSession();

function defaultProfile(uid: string, email: string, pseudo?: string): UserProfile {
  return { uid, email, pseudo: pseudo || 'Manager', monnaie: 200, niveau: 1, gainParClic: 1, totalClics: 0, palierActuel: 0 };
}

export async function ensureUserDoc(uid: string, email: string, pseudo?: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, { ...defaultProfile(uid, email, pseudo), createdAt: serverTimestamp() });
}

export async function register(email: string, password: string, pseudo: string) {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  await updateProfile(cred.user, { displayName: pseudo });
  await ensureUserDoc(cred.user.uid, cred.user.email || email, pseudo);
}

export async function login(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  await ensureUserDoc(cred.user.uid, cred.user.email || email, cred.user.displayName || undefined);
}

export async function forgotPassword(email: string) { await sendPasswordResetEmail(firebaseAuth, email.trim()); }
export async function logout() { await signOut(firebaseAuth); }

export function useGoogleLogin() {
  const expoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? 'dtm-missing-expo-client-id';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? 'dtm-missing-ios-client-id';
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? 'dtm-missing-android-client-id';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? 'dtm-missing-web-client-id';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: expoClientId,
    iosClientId,
    androidClientId,
    webClientId,
  });

  const loginWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const cred = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      await ensureUserDoc(cred.user.uid, cred.user.email || '', cred.user.displayName || undefined);
      return;
    }
    const result = await promptAsync();
    if (result.type !== 'success' || !result.authentication?.idToken) return;
    const credential = GoogleAuthProvider.credential(result.authentication.idToken);
    const userCred = await signInWithCredential(firebaseAuth, credential);
    await ensureUserDoc(userCred.user.uid, userCred.user.email || '', userCred.user.displayName || undefined);
  };

  return { request, response, loginWithGoogle };
}
