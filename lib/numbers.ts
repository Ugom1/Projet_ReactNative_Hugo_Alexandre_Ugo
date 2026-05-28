/** Valeur numérique sûre (évite NaN dans l'UI et Firestore). */
export function safeNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function safeCoins(value: unknown): number {
  return Math.max(0, Math.floor(safeNum(value, 0)));
}
