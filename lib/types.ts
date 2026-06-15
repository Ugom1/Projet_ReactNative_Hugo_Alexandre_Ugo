export type Position = 'ATT' | 'MDC' | 'DC' | 'GB';
export type SlotId = Position | 'EXTRA';
export type Rarete = 'UNCOMMON' | 'RARE' | 'SUPER_RARE' | 'UNIQUE';
export type Ligue = 'Ligue 1' | 'Premier League' | 'Liga' | 'Serie A';

export type UserProfile = {
  uid: string;
  email: string;
  pseudo: string;
  monnaie: number;
  niveau: number;
  gainParClic: number;
  upgradeCost: number;
  totalClics: number;
  palierActuel: number;
  autoClickPerSec?: number;
  photoURL?: string;
};

export type PackId = 'bronze' | 'argent' | 'or' | 'elite';

/** Fiche joueur globale — collection Firestore `cards/{cardId}`. */
export type CardTemplate = {
  cardId: string;
  apiId?: number;
  nom: string;
  position: Position;
  ligue: Ligue;
  nationalite: string;
  note: number;
  image: string;
};

/** Lien global — `cards/{cardId}/owners/{ownershipId}` (optionnel, pour la console). */
export type CardOwnerDoc = {
  uid: string;
  cardId: string;
  rarete: Rarete;
  obtainedAt?: unknown;
};

/** Possession — `users/{uid}/collection/{ownershipId}`. */
export type OwnedCardDoc = {
  cardId: string;
  rarete: Rarete;
  obtainedAt?: unknown;
  /** Lien optionnel vers cards/{cardId}/owners/{id} */
  catalogOwnerId?: string;
};

export type PlayerCard = {
  /** ID du document collection (users/.../collection/{id}). */
  id: string;
  /** ID dans le catalogue global cards/{cardId}. */
  cardId: string;
  nom: string;
  position: Position;
  ligue: Ligue;
  nationalite: string;
  note: number;
  rarete: Rarete;
  image: string;
  /** Timestamp ms (obtention). */
  obtainedAt?: number;
};

export type MatchCondition = {
  id: string;
  label: string;
  check: (cards: PlayerCard[], slots: Partial<Record<SlotId, PlayerCard>>) => boolean;
};

export type CompositionDoc = {
  palierCible: number;
  condition: { id: string; label: string };
  slots: Partial<Record<SlotId, string>>;
  scoreMoyen: number;
  updatedAt?: unknown;
};

export type MatchResult = {
  victoire: boolean;
  score: number;
  scoreRequis: number;
  recompense: number;
  palier: number;
  bonusPack?: PackId;
  bonusCard?: PlayerCard;
};
