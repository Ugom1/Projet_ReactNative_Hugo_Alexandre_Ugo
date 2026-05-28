import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { safeCoins } from '@/lib/numbers';
import type { DreamTeam, PlayerSlot } from '@/lib/schemas';
import { grantAchievement } from './userService';

export function subscribeTeams(userId: string, cb: (teams: DreamTeam[]) => void): Unsubscribe {
  const q = query(collection(db, 'dreamTeams'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DreamTeam));
    cb(teams);
  });
}

export async function createTeam(team: Omit<DreamTeam, 'id'>) {
  const ref = await addDoc(collection(db, 'dreamTeams'), {
    ...team,
    players: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await grantAchievement(team.userId, 'first_team');
  return ref.id;
}

export async function updateTeam(teamId: string, data: Partial<DreamTeam>) {
  await updateDoc(doc(db, 'dreamTeams', teamId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeam(teamId: string) {
  await deleteDoc(doc(db, 'dreamTeams', teamId));
}

export async function setTeamPlayer(
  teamId: string,
  userId: string,
  players: PlayerSlot[],
  slot: PlayerSlot
) {
  const filtered = players.filter((p) => p.slotId !== slot.slotId);
  const next = [...filtered, slot];
  await updateTeam(teamId, { players: next });
  if (next.length >= 11) {
    await grantAchievement(userId, 'full_squad');
  }
}

/** Achat joueur : déduction coins + ajout slot en une seule transaction. */
export async function purchasePlayer(
  userId: string,
  teamId: string,
  slot: PlayerSlot,
  price: number
) {
  let squadSize = 0;
  await runTransaction(db, async (tx) => {
    const userRef = doc(db, 'users', userId);
    const teamRef = doc(db, 'dreamTeams', teamId);
    const userSnap = await tx.get(userRef);
    const teamSnap = await tx.get(teamRef);

    if (!userSnap.exists()) throw new Error('Profil introuvable');
    if (!teamSnap.exists()) throw new Error('Équipe introuvable');
    if (teamSnap.data()?.userId !== userId) throw new Error('Accès refusé');

    const coins = safeCoins(userSnap.data()?.coins);
    if (coins < price) throw new Error('Pas assez de coins');

    const players = (teamSnap.data()?.players ?? []) as PlayerSlot[];
    const next = [...players.filter((p) => p.slotId !== slot.slotId), slot];
    squadSize = next.length;

    tx.update(userRef, { coins: coins - price });
    tx.update(teamRef, { players: next, updatedAt: serverTimestamp() });
  });

  if (squadSize >= 11) {
    await grantAchievement(userId, 'full_squad');
  }
}

export async function removeTeamPlayer(teamId: string, players: PlayerSlot[], slotId: string) {
  await updateTeam(teamId, { players: players.filter((p) => p.slotId !== slotId) });
}

export async function getUserTeamsOnce(userId: string) {
  const q = query(collection(db, 'dreamTeams'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DreamTeam));
}
