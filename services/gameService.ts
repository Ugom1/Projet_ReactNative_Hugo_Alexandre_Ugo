import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { createRandomCard, normalizeRarete, recycleGemsForCard, rewardForPalier, simulateMatch, bonusPackForPalier } from '@/lib/game';
import {
  fetchUserCollection,
  grantCardToUser,
  deleteCatalogOwnerLink,
  hydrateUserCollection,
  syncCardCatalog,
  userCollectionQuery,
} from '@/services/cardCatalogService';
import type { CompositionDoc, MatchResult, PackId, PlayerCard, Rarete, SlotId, UserProfile } from '@/lib/types';

export function subscribeUser(uid: string, cb: (user: UserProfile | null) => void) {
  return onSnapshot(
    doc(getDb(), 'users', uid),
    (snap) => {
      if (!snap.exists()) return cb(null);
      const data = snap.data();
      cb({
        uid,
        email: data.email ?? '',
        pseudo: data.pseudo ?? 'Manager',
        monnaie: data.monnaie ?? 0,
        niveau: data.niveau ?? 1,
        gainParClic: data.gainParClic ?? 1,
        upgradeCost: data.upgradeCost ?? 100,
        totalClics: data.totalClics ?? 0,
        palierActuel: data.palierActuel ?? 0,
        autoClickPerSec: data.autoClickPerSec ?? 0,
        photoURL: data.photoURL ?? undefined,
      });
    },
    () => cb(null)
  );
}

export async function getUser(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    email: data.email ?? '',
    pseudo: data.pseudo ?? 'Manager',
    monnaie: data.monnaie ?? 0,
    niveau: data.niveau ?? 1,
    gainParClic: data.gainParClic ?? 1,
    upgradeCost: data.upgradeCost ?? 100,
    totalClics: data.totalClics ?? 0,
    palierActuel: data.palierActuel ?? 0,
    autoClickPerSec: data.autoClickPerSec ?? 0,
    photoURL: data.photoURL ?? undefined,
  };
}

export async function getCollection(uid: string): Promise<PlayerCard[]> {
  return fetchUserCollection(uid);
}

export function subscribeCollection(uid: string, cb: (cards: PlayerCard[]) => void) {
  return onSnapshot(userCollectionQuery(uid), async (snap) => {
    cb(await hydrateUserCollection(snap.docs));
  });
}

export async function click(uid: string, gainParClic: number) {
  await updateDoc(doc(getDb(), 'users', uid), {
    monnaie: increment(gainParClic),
    totalClics: increment(1),
  });
}

export async function upgradeClick(uid: string, user: UserProfile) {
  const price = user.upgradeCost ?? user.gainParClic * 100;
  if (user.monnaie < price) throw new Error('Monnaie insuffisante');
  await updateDoc(doc(getDb(), 'users', uid), {
    monnaie: increment(-price),
    gainParClic: increment(1),
    niveau: increment(1),
    upgradeCost: Math.floor(price * 1.5),
  });
}

export async function saveComposition(uid: string, data: CompositionDoc) {
  await setDoc(doc(getDb(), 'users', uid, 'composition', 'current'), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function loadComposition(uid: string): Promise<CompositionDoc | null> {
  const snap = await getDoc(doc(getDb(), 'users', uid, 'composition', 'current'));
  if (!snap.exists()) return null;
  return snap.data() as CompositionDoc;
}

export async function deleteComposition(uid: string) {
  await deleteDoc(doc(getDb(), 'users', uid, 'composition', 'current'));
}

export async function openPack(uid: string, packId: PackId): Promise<PlayerCard> {
  const { PACKS } = await import('@/lib/game');
  const pack = PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error('Pack inconnu');

  const userRef = doc(getDb(), 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Utilisateur introuvable');
  const user = userSnap.data() as UserProfile;
  if (user.monnaie < pack.prix) throw new Error('Pas assez de gems');

  const drop = createRandomCard(packId);
  await updateDoc(userRef, { monnaie: increment(-pack.prix) });
  try {
    return await grantCardToUser(uid, drop.cardId, drop.rarete);
  } catch (err) {
    await updateDoc(userRef, { monnaie: increment(pack.prix) });
    throw err;
  }
}

export async function deleteCard(uid: string, cardId: string, ownershipId: string) {
  const ref = doc(getDb(), 'users', uid, 'collection', ownershipId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Carte introuvable');
  await deleteCatalogOwnerLink(cardId, snap.data());
  await deleteDoc(ref);
}

export async function recycleCard(uid: string, cardId: string, ownershipId: string): Promise<{ gems: number }> {
  const ref = doc(getDb(), 'users', uid, 'collection', ownershipId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Carte introuvable');

  const data = snap.data();
  const gems = recycleGemsForCard({ rarete: normalizeRarete(String(data.rarete ?? '')) });
  await updateDoc(doc(getDb(), 'users', uid), { monnaie: increment(gems) });
  await deleteCatalogOwnerLink(cardId, data);
  await deleteDoc(ref);
  return { gems };
}

export type RecycleItem = { cardId: string; ownershipId: string };

export async function recycleCards(uid: string, items: RecycleItem[]): Promise<{ gems: number; count: number }> {
  if (!items.length) throw new Error('Aucune carte sélectionnée');

  const batch = writeBatch(getDb());
  const userRef = doc(getDb(), 'users', uid);
  let totalGems = 0;
  let count = 0;

  for (const { cardId, ownershipId } of items) {
    const ref = doc(getDb(), 'users', uid, 'collection', ownershipId);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;

    const data = snap.data();
    totalGems += recycleGemsForCard({ rarete: normalizeRarete(String(data.rarete ?? '')) });
    batch.delete(ref);
    if (data.catalogOwnerId) {
      batch.delete(doc(getDb(), 'cards', cardId, 'owners', String(data.catalogOwnerId)));
    }
    count++;
  }

  if (!count) throw new Error('Aucune carte valide à recycler');

  batch.update(userRef, { monnaie: increment(totalGems) });
  await batch.commit();

  return { gems: totalGems, count };
}

export async function completeMatch(
  uid: string,
  palierIndex: number,
  victoire: boolean,
  score: number,
  scoreRequis: number
): Promise<MatchResult> {
  const recompense = victoire ? rewardForPalier(palierIndex) : 0;
  const userRef = doc(getDb(), 'users', uid);
  const userSnap = await getDoc(userRef);
  const currentPalier = userSnap.exists() ? (userSnap.data().palierActuel ?? 0) : 0;

  let bonusPack: MatchResult['bonusPack'];
  let bonusCard: PlayerCard | undefined;

  if (victoire) {
    const updates: Record<string, unknown> = { monnaie: increment(recompense) };
    if (palierIndex === currentPalier) {
      updates.palierActuel = palierIndex + 1;
    }
    await updateDoc(userRef, updates);

    bonusPack = bonusPackForPalier(palierIndex);
    const drop = createRandomCard(bonusPack);
    bonusCard = await grantCardToUser(uid, drop.cardId, drop.rarete);
  }

  await addDoc(collection(getDb(), 'users', uid, 'matchHistory'), {
    resultat: victoire ? 'victoire' : 'defaite',
    score,
    scoreRequis,
    palier: palierIndex,
    recompense,
    bonusPack: bonusPack ?? null,
    playedAt: serverTimestamp(),
  });

  return { victoire, score, scoreRequis, recompense, palier: palierIndex, bonusPack, bonusCard };
}

export async function playMatch(
  uid: string,
  palierIndex: number,
  moyenne: number,
  scoreRequis: number
): Promise<MatchResult> {
  const { score, victoire } = simulateMatch(moyenne, scoreRequis);
  return completeMatch(uid, palierIndex, victoire, score, scoreRequis);
}

export async function resetPaliers(uid: string): Promise<void> {
  await updateDoc(doc(getDb(), 'users', uid), { palierActuel: 0 });
}

export function resolveSlots(
  slots: Partial<Record<SlotId, string>>,
  collection: PlayerCard[]
): Partial<Record<SlotId, PlayerCard>> {
  const map: Partial<Record<SlotId, PlayerCard>> = {};
  for (const [slot, ownershipId] of Object.entries(slots) as [SlotId, string][]) {
    const card = collection.find((c) => c.id === ownershipId);
    if (card) map[slot] = card;
  }
  return map;
}

export { syncCardCatalog };
