import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { normalizeUserProfile, profileNeedsRepair } from '@/lib/normalize-profile';
import { safeCoins, safeNum } from '@/lib/numbers';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Platform } from 'react-native';
import { firebaseAuth, db, storage } from '@/lib/firebase';
import { MAX_AVATAR_DATA_URL_LENGTH, uriToDataUrl } from '@/lib/image-utils';
import type { UserProfile } from '@/lib/schemas';
import { ACHIEVEMENTS } from '@/lib/constants';

const defaultProfile = (user: User): Omit<UserProfile, 'uid'> & { uid: string } => ({
  uid: user.uid,
  email: user.email ?? '',
  displayName: user.displayName ?? 'Joueur',
  photoURL: user.photoURL ?? undefined,
  coins: 200,
  xp: 0,
  totalClicks: 0,
  clickPower: 1,
  activeBoosts: [],
  achievements: [],
  disabled: false,
});

export async function signUp(email: string, password: string, displayName: string) {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, 'users', cred.user.uid), {
    ...defaultProfile(cred.user),
    displayName,
    createdAt: serverTimestamp(),
  })
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (snap.exists() && snap.data().disabled) {
    await signOut(firebaseAuth);
    throw new Error('Compte désactivé. Contacte le support.');
  }
  return cred.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(firebaseAuth, email);
}

export function subscribeUser(uid: string, cb: (p: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb(normalizeUserProfile(uid, snap.data() as Record<string, unknown>));
  });
}

export async function repairUserProfile(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const raw = snap.data() as Record<string, unknown>;
  if (!profileNeedsRepair(raw)) return;
  await updateDoc(ref, {
    coins: safeCoins(raw.coins) || 200,
    xp: safeNum(raw.xp, 0),
    totalClicks: safeNum(raw.totalClicks, 0),
    clickPower: Math.max(1, safeNum(raw.clickPower, 1)),
    activeBoosts: Array.isArray(raw.activeBoosts) ? raw.activeBoosts : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
  });
}

export async function ensureUserDoc(user: User) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...defaultProfile(user), createdAt: serverTimestamp() });
  } else {
    await repairUserProfile(user.uid);
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
}

export async function addCoinsAndXp(
  uid: string,
  coins: number,
  xp: number,
  extra?: Partial<UserProfile>
) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('Profil introuvable');
  const cur = normalizeUserProfile(uid, snap.data() as Record<string, unknown>);
  await updateDoc(doc(db, 'users', uid), {
    coins: cur.coins + safeNum(coins, 0),
    xp: cur.xp + safeNum(xp, 0),
    ...extra,
  });
}

export async function registerClick(uid: string, reward: number) {
  const safeReward = Math.max(1, Math.round(safeNum(reward, 1)));
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('Profil introuvable. Reconnecte-toi.');
  const cur = normalizeUserProfile(uid, snap.data() as Record<string, unknown>);
  const totalClicks = cur.totalClicks + 1;
  let newCoins = cur.coins + safeReward;
  const achievements = [...cur.achievements];

  if (totalClicks >= 1000 && !achievements.includes('clicker_1k')) {
    achievements.push('clicker_1k');
    newCoins += 50;
  }
  if (newCoins >= 10000 && !achievements.includes('coins_10k')) {
    achievements.push('coins_10k');
    newCoins += 100;
  }

  await updateDoc(doc(db, 'users', uid), {
    coins: newCoins,
    totalClicks,
    clickPower: cur.clickPower,
    achievements,
  });
}

export async function purchaseBoost(uid: string, boostId: string, price: number, boost: UserProfile['activeBoosts'][0]) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('Profil introuvable');
  const cur = normalizeUserProfile(uid, snap.data() as Record<string, unknown>);
  if (cur.coins < price) throw new Error('Pas assez de coins');
  await updateDoc(doc(db, 'users', uid), {
    coins: cur.coins - price,
    activeBoosts: [...cur.activeBoosts, boost],
  });
}

export async function cleanExpiredBoosts(uid: string, boosts: UserProfile['activeBoosts']) {
  const now = Date.now();
  const active = boosts.filter((b) => b.expiresAt > now);
  if (active.length !== boosts.length) {
    await updateDoc(doc(db, 'users', uid), { activeBoosts: active });
  }
  return active;
}

export async function grantAchievement(uid: string, achievementId: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;
  const cur = normalizeUserProfile(uid, snap.data() as Record<string, unknown>);
  if (cur.achievements.includes(achievementId)) return;
  const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
  await updateDoc(doc(db, 'users', uid), {
    achievements: [...cur.achievements, achievementId],
    coins: cur.coins + (def?.rewardCoins ?? 0),
  });
}

export async function uploadAvatar(user: User, uri: string) {
  // Sur le web, Firebase Storage exige CORS sur le bucket → on stocke en Firestore (data URL).
  if (Platform.OS === 'web') {
    const dataUrl = await uriToDataUrl(uri);
    if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
      throw new Error(
        'Image trop lourde. Choisis une photo plus petite ou utilise Expo Go sur téléphone.'
      );
    }
    await updateDoc(doc(db, 'users', user.uid), { photoURL: dataUrl });
    return dataUrl;
  }

  const blob = await (await fetch(uri)).blob();
  const path = `avatars/${user.uid}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  await updateProfile(user, { photoURL: url });
  await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
  return url;
}

export async function changePassword(user: User, current: string, next: string) {
  const cred = EmailAuthProvider.credential(user.email!, current);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, next);
}

export async function disableAccount(user: User) {
  await updateDoc(doc(db, 'users', user.uid), { disabled: true });
  await signOut(firebaseAuth);
}

export async function deleteAccount(user: User, password: string) {
  const cred = EmailAuthProvider.credential(user.email!, password);
  await reauthenticateWithCredential(user, cred);
  try {
    await deleteObject(ref(storage, `avatars/${user.uid}.jpg`));
  } catch {
    /* optional */
  }
  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
}

export async function logout() {
  await signOut(firebaseAuth);
}
