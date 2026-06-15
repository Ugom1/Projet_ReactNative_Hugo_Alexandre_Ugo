import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getDb, getFirebaseAuth } from '@/lib/firebase';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { createRandomCard } from '@/lib/game';
import { forgotPasswordSchema, loginSchema, profileUpdateSchema, signupSchema } from '@/lib/schemas';
import type { OwnedCardDoc, UserProfile } from '@/lib/types';
import {
  seedPlayerToCardId,
  seedPlayerToTemplate,
  syncCardCatalog,
  userCollectionRef,
} from '@/services/cardCatalogService';
import { SEED_PLAYERS } from '@/data/players.seed';

function defaultProfile(uid: string, email: string, pseudo?: string): Omit<UserProfile, 'uid'> & { uid: string } {
  return {
    uid,
    email,
    pseudo: pseudo || 'Manager',
    monnaie: 1250,
    niveau: 1,
    gainParClic: 1,
    upgradeCost: 100,
    totalClics: 0,
    palierActuel: 0,
    autoClickPerSec: 0,
  };
}

export async function ensureUserDoc(uid: string, email: string, pseudo?: string) {
  const ref = doc(getDb(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...defaultProfile(uid, email, pseudo), createdAt: serverTimestamp() });
    await syncCardCatalog();

    const batch = writeBatch(getDb());
    const packs: Array<'bronze' | 'argent'> = ['bronze', 'bronze', 'bronze', 'argent', 'bronze'];

    for (const packId of packs) {
      const drop = createRandomCard(packId);
      const seed = SEED_PLAYERS.find((p) => seedPlayerToCardId(p) === drop.cardId);
      if (seed) {
        batch.set(doc(getDb(), 'cards', drop.cardId), seedPlayerToTemplate(seed), { merge: true });
      }
      const userColRef = userCollectionRef(uid);
      batch.set(userColRef, {
        cardId: drop.cardId,
        rarete: drop.rarete,
        obtainedAt: serverTimestamp(),
      } satisfies OwnedCardDoc);
    }

    await batch.commit();
  }
}

export async function register(
  email: string,
  password: string,
  pseudo: string,
  confirmPassword: string,
  acceptTerms: boolean
) {
  const parsed = signupSchema.safeParse({ pseudo, email, password, confirmPassword, acceptTerms });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Données invalides');

  try {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    await updateProfile(cred.user, { displayName: pseudo });
    await ensureUserDoc(cred.user.uid, cred.user.email || email, pseudo);
  } catch (e) {
    throw new Error(getAuthErrorMessage(e));
  }
}

export async function login(email: string, password: string) {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Données invalides');

  try {
    const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    try {
      await ensureUserDoc(cred.user.uid, cred.user.email || email, cred.user.displayName || undefined);
    } catch {
      // Auth OK — profil Firestore sera créé au prochain accès si règles déployées
    }
  } catch (e) {
    throw new Error(getAuthErrorMessage(e));
  }
}

export async function forgotPassword(email: string) {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Email invalide');
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  } catch (e) {
    throw new Error(getAuthErrorMessage(e));
  }
}

export async function logout() {
  await signOut(getFirebaseAuth());
}

export async function updateUserProfile(uid: string, pseudo: string) {
  const parsed = profileUpdateSchema.safeParse({ pseudo });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Pseudo invalide');

  const trimmed = parsed.data.pseudo.trim();
  await updateDoc(doc(getDb(), 'users', uid), { pseudo: trimmed });

  const user = getFirebaseAuth().currentUser;
  if (user) {
    await updateProfile(user, { displayName: trimmed });
  }
}
