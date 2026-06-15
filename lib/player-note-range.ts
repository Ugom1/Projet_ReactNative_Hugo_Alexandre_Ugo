/** Plage de notes autorisées dans le catalogue et les packs. */
export const MIN_PLAYER_NOTE = 75;
export const MAX_PLAYER_NOTE = 91;

export function resolveRawNote(data: { note?: number; ovr?: number }): number {
  const n = data.note ?? data.ovr;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

export function isInCatalogNoteRange(note: number): boolean {
  return note >= MIN_PLAYER_NOTE && note <= MAX_PLAYER_NOTE;
}
