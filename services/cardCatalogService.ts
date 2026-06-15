import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { noteToRarete, normalizeRarete } from '@/lib/game';
import { SEED_PLAYERS, resolvePlayerNote } from '@/data/players.seed';
import { getDb } from '@/lib/firebase';
import type { CardOwnerDoc, CardTemplate, OwnedCardDoc, PlayerCard, Rarete } from '@/lib/types';
import type { SeedPlayer } from '@/data/players.seed';

const CATALOG_SYNC_KEY = 'dtm_catalog_synced';
let catalogSyncPromise: Promise<void> | null = null;
let migrationDoneFor = new Set<string>();

export function seedPlayerToCardId(player: Pick<SeedPlayer, 'apiId' | 'nom'>): string {
  if (player.apiId != null) return String(player.apiId);
  return player.nom.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function seedPlayerToTemplate(player: SeedPlayer): CardTemplate {
  const cardId = seedPlayerToCardId(player);
  return {
    cardId,
    apiId: player.apiId,
    nom: player.nom,
    position: player.position,
    ligue: player.ligue,
    nationalite: player.nationalite,
    note: resolvePlayerNote(player),
    image: player.image,
  };
}

function templateFromSeed(cardId: string): CardTemplate | null {
  const seed = SEED_PLAYERS.find((p) => seedPlayerToCardId(p) === cardId);
  return seed ? seedPlayerToTemplate(seed) : null;
}

export function userCollectionRef(uid: string, ownershipId?: string) {
  return ownershipId
    ? doc(getDb(), 'users', uid, 'collection', ownershipId)
    : doc(collection(getDb(), 'users', uid, 'collection'));
}

export function parseFirestoreTime(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null) {
    if ('toMillis' in value && typeof (value as { toMillis: () => number }).toMillis === 'function') {
      return (value as { toMillis: () => number }).toMillis();
    }
    if ('seconds' in value) return Number((value as { seconds: number }).seconds) * 1000;
  }
  return 0;
}

export function mergeOwnedWithTemplate(
  ownershipId: string,
  owned: Pick<OwnedCardDoc, 'cardId' | 'rarete' | 'obtainedAt'>,
  template: CardTemplate
): PlayerCard {
  return {
    id: ownershipId,
    cardId: template.cardId,
    nom: template.nom,
    position: template.position,
    ligue: template.ligue,
    nationalite: template.nationalite,
    note: template.note,
    rarete: noteToRarete(template.note),
    image: template.image,
    obtainedAt: parseFirestoreTime(owned.obtainedAt),
  };
}

/** Cartes embarquées (très ancien format). */
export function legacyDocToPlayerCard(ownershipId: string, data: Record<string, unknown>): PlayerCard | null {
  const cardId = String(data.cardId ?? data.apiId ?? '');
  const rarete = normalizeRarete(String(data.rarete ?? ''));

  if (cardId) {
    const fromSeed = templateFromSeed(cardId);
    if (fromSeed) {
      return mergeOwnedWithTemplate(ownershipId, { cardId, rarete: noteToRarete(fromSeed.note) }, fromSeed);
    }
  }

  const note = Number(data.note ?? data.ovr);
  if (!data.nom || !note) return null;
  return {
    id: ownershipId,
    cardId: cardId || ownershipId,
    nom: String(data.nom),
    position: data.position as PlayerCard['position'],
    ligue: data.ligue as PlayerCard['ligue'],
    nationalite: String(data.nationalite ?? 'Inconnu'),
    note,
    rarete: noteToRarete(note),
    image: String(data.image ?? ''),
    obtainedAt: parseFirestoreTime(data.obtainedAt),
  };
}

export async function getCardTemplate(cardId: string): Promise<CardTemplate | null> {
  const fromSeed = templateFromSeed(cardId);
  if (fromSeed) return fromSeed;

  const snap = await getDoc(doc(getDb(), 'cards', cardId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const note = Number(data.note ?? data.ovr);
  if (!note) return null;
  return {
    cardId,
    apiId: data.apiId,
    nom: data.nom,
    position: data.position,
    ligue: data.ligue,
    nationalite: data.nationalite,
    note,
    image: data.image,
  };
}

export async function syncCardCatalog(force = false): Promise<void> {
  if (!force && catalogSyncPromise) return catalogSyncPromise;

  catalogSyncPromise = (async () => {
    try {
      const marker = doc(getDb(), 'cards', CATALOG_SYNC_KEY);
      const markerSnap = await getDoc(marker);
      if (!force && markerSnap.exists()) return;
      console.info('[DTM] Catalogue Firestore absent — exécutez: npm run sync:cards');
    } catch (err) {
      console.warn('[DTM] syncCardCatalog:', (err as Error)?.message || err);
    }
  })();

  return catalogSyncPromise;
}

/** Lit `users/{uid}/collection/*` et hydrate avec le catalogue. */
export async function hydrateUserCollection(
  docs: { id: string; data: () => Record<string, unknown> }[]
): Promise<PlayerCard[]> {
  const cards: PlayerCard[] = [];

  for (const d of docs) {
    const raw = d.data();
    if (raw.cardId && raw.rarete) {
      const owned: OwnedCardDoc = {
        cardId: String(raw.cardId),
        rarete: raw.rarete as Rarete,
        obtainedAt: raw.obtainedAt,
      };
      const template = templateFromSeed(owned.cardId) ?? (await getCardTemplate(owned.cardId));
      if (template) cards.push(mergeOwnedWithTemplate(d.id, owned, template));
      continue;
    }
    const legacy = legacyDocToPlayerCard(d.id, raw);
    if (legacy) cards.push(legacy);
  }

  return cards;
}

/** Copie cards/.../owners → users/.../collection (packs ouverts avant la migration). */
async function migrateOwnersToUserCollection(uid: string): Promise<void> {
  if (migrationDoneFor.has(uid)) return;
  migrationDoneFor.add(uid);

  try {
    const ownersQ = query(collectionGroup(getDb(), 'owners'), where('uid', '==', uid));
    const ownersSnap = await getDocs(ownersQ);
    if (ownersSnap.empty) return;

    const userSnap = await getDocs(collection(getDb(), 'users', uid, 'collection'));
    const knownCatalogIds = new Set(
      userSnap.docs.map((d) => String(d.data().catalogOwnerId ?? '')).filter(Boolean)
    );

    let batch = writeBatch(getDb());
    let ops = 0;

    for (const d of ownersSnap.docs) {
      if (knownCatalogIds.has(d.id)) continue;
      const data = d.data();
      batch.set(doc(getDb(), 'users', uid, 'collection', d.id), {
        cardId: String(data.cardId),
        rarete: data.rarete,
        obtainedAt: data.obtainedAt,
        catalogOwnerId: d.id,
      } satisfies OwnedCardDoc);
      ops++;
      if (ops >= 400) {
        await batch.commit();
        batch = writeBatch(getDb());
        ops = 0;
      }
    }

    if (ops > 0) await batch.commit();
  } catch {
    // Index collectionGroup absent — les nouvelles cartes passent par users/collection
  }
}

export async function fetchUserCollection(uid: string): Promise<PlayerCard[]> {
  await migrateOwnersToUserCollection(uid);
  const snap = await getDocs(collection(getDb(), 'users', uid, 'collection'));
  return hydrateUserCollection(snap.docs);
}

export function userCollectionQuery(uid: string) {
  return collection(getDb(), 'users', uid, 'collection');
}

export async function grantCardToUser(uid: string, cardId: string, rarete: Rarete): Promise<PlayerCard> {
  const template = templateFromSeed(cardId);
  if (!template) throw new Error('Joueur introuvable dans le catalogue');

  await setDoc(doc(getDb(), 'cards', cardId), template, { merge: true });

  const userColRef = userCollectionRef(uid);
  const catalogOwnerRef = doc(collection(getDb(), 'cards', cardId, 'owners'));

  await setDoc(catalogOwnerRef, {
    uid,
    cardId,
    rarete: noteToRarete(template.note),
    obtainedAt: serverTimestamp(),
  } satisfies CardOwnerDoc);

  await setDoc(userColRef, {
    cardId,
    rarete: noteToRarete(template.note),
    obtainedAt: serverTimestamp(),
    catalogOwnerId: catalogOwnerRef.id,
  } satisfies OwnedCardDoc);

  return mergeOwnedWithTemplate(userColRef.id, { cardId, rarete: noteToRarete(template.note) }, template);
}

export async function deleteCatalogOwnerLink(cardId: string, data: Record<string, unknown>) {
  const catalogOwnerId = String(data.catalogOwnerId ?? '');
  if (!catalogOwnerId) return;
  try {
    await deleteDoc(doc(getDb(), 'cards', cardId, 'owners', catalogOwnerId));
  } catch {
    // lien catalogue optionnel
  }
}
