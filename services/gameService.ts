import { addDoc, collection, doc, getDoc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PACKS, createRandomCard } from '@/lib/game';
import type { PlayerCard, UserProfile } from '@/lib/types';

export function subscribeUser(uid: string, cb: (user: UserProfile | null) => void) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
    () => cb(null)
  );
}

export function subscribeCollection(uid: string, cb: (cards: PlayerCard[]) => void) {
  let fallbackUnsub: (() => void) | undefined;

  const primaryUnsub = onSnapshot(
    collection(db, 'users', uid, 'collection'),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlayerCard, 'id'>) })));
    },
    () => {
      if (fallbackUnsub) return;
      fallbackUnsub = onSnapshot(doc(db, 'users', uid), (userSnap) => {
        if (!userSnap.exists()) return cb([]);
        const cache = (userSnap.data().collectionCache || []) as PlayerCard[];
        cb(cache);
      });
    }
  );

  return () => {
    primaryUnsub();
    fallbackUnsub?.();
  };
}

export async function click(uid: string, gainParClic: number) { await updateDoc(doc(db, 'users', uid), { monnaie: increment(gainParClic), totalClics: increment(1) }); }
export async function upgradeClick(uid: string, user: UserProfile) {
  const price = user.gainParClic * 50;
  if (user.monnaie < price) throw new Error('Monnaie insuffisante');
  await updateDoc(doc(db, 'users', uid), { monnaie: increment(-price), gainParClic: increment(1) });
}
export async function unlockPalier(uid: string, nextIndex: number) { await updateDoc(doc(db, 'users', uid), { palierActuel: nextIndex }); }
export async function saveComposition(uid: string, cards: PlayerCard[]) {
  try {
    await setDoc(doc(db, 'users', uid, 'composition', 'active'), { cards, updatedAt: serverTimestamp() });
  } catch {
    await updateDoc(doc(db, 'users', uid), { compositionCache: cards, updatedAt: serverTimestamp() });
  }
}
export async function loadComposition(uid: string) {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'composition', 'active'));
    return snap.exists() ? ((snap.data().cards || []) as PlayerCard[]) : [];
  } catch {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return [];
    return (userSnap.data().compositionCache || []) as PlayerCard[];
  }
}

export async function openPack(uid: string, packId: string) {
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error('Pack inconnu');
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Utilisateur introuvable');
  const user = userSnap.data() as UserProfile;
  if (user.monnaie < pack.prix) throw new Error('Pas assez de monnaie');

  const card = createRandomCard(packId);
  try {
    await updateDoc(userRef, { monnaie: increment(-pack.prix) });
    await addDoc(collection(db, 'users', uid, 'collection'), { ...card, createdAt: serverTimestamp() });
  } catch {
    const cache = ((userSnap.data().collectionCache || []) as PlayerCard[]).slice();
    cache.push(card);
    await updateDoc(userRef, {
      monnaie: increment(-pack.prix),
      collectionCache: cache,
      updatedAt: serverTimestamp(),
    });
  }
  return card;
}
