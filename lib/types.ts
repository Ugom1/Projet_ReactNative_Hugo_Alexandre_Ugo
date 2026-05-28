export type UserProfile = {
  uid: string;
  email: string;
  pseudo: string;
  monnaie: number;
  niveau: number;
  gainParClic: number;
  totalClics: number;
  palierActuel: number;
};

export type PlayerCard = {
  id: string;
  nom: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  ligue: 'Ligue 1' | 'Premier League' | 'Liga' | 'Serie A';
  nation: string;
  note: number;
  rarete: 'Bronze' | 'Argent' | 'Or' | 'Elite';
  image: string;
};

export type MatchCondition = {
  id: string;
  label: string;
  check: (cards: PlayerCard[]) => boolean;
};
