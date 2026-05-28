export type PitchSlot = {
  id: string;
  label: string;
  position: string;
  x: number;
  y: number;
};

const mk = (formation: string, slots: Omit<PitchSlot, 'id'>[]): PitchSlot[] =>
  slots.map((s, i) => ({ ...s, id: `${formation}-${i}` }));

export const FORMATION_SLOTS: Record<string, PitchSlot[]> = {
  '4-4-2': mk('4-4-2', [
    { label: 'GK', position: 'G', x: 0.5, y: 0.92 },
    { label: 'LB', position: 'D', x: 0.15, y: 0.72 },
    { label: 'CB1', position: 'D', x: 0.38, y: 0.75 },
    { label: 'CB2', position: 'D', x: 0.62, y: 0.75 },
    { label: 'RB', position: 'D', x: 0.85, y: 0.72 },
    { label: 'LM', position: 'M', x: 0.15, y: 0.48 },
    { label: 'CM1', position: 'M', x: 0.38, y: 0.45 },
    { label: 'CM2', position: 'M', x: 0.62, y: 0.45 },
    { label: 'RM', position: 'M', x: 0.85, y: 0.48 },
    { label: 'ST1', position: 'F', x: 0.38, y: 0.18 },
    { label: 'ST2', position: 'F', x: 0.62, y: 0.18 },
  ]),
  '4-3-3': mk('4-3-3', [
    { label: 'GK', position: 'G', x: 0.5, y: 0.92 },
    { label: 'LB', position: 'D', x: 0.15, y: 0.72 },
    { label: 'CB1', position: 'D', x: 0.38, y: 0.75 },
    { label: 'CB2', position: 'D', x: 0.62, y: 0.75 },
    { label: 'RB', position: 'D', x: 0.85, y: 0.72 },
    { label: 'CM1', position: 'M', x: 0.25, y: 0.48 },
    { label: 'CM2', position: 'M', x: 0.5, y: 0.45 },
    { label: 'CM3', position: 'M', x: 0.75, y: 0.48 },
    { label: 'LW', position: 'F', x: 0.15, y: 0.2 },
    { label: 'ST', position: 'F', x: 0.5, y: 0.15 },
    { label: 'RW', position: 'F', x: 0.85, y: 0.2 },
  ]),
  '3-5-2': mk('3-5-2', [
    { label: 'GK', position: 'G', x: 0.5, y: 0.92 },
    { label: 'CB1', position: 'D', x: 0.25, y: 0.75 },
    { label: 'CB2', position: 'D', x: 0.5, y: 0.78 },
    { label: 'CB3', position: 'D', x: 0.75, y: 0.75 },
    { label: 'LWB', position: 'M', x: 0.1, y: 0.52 },
    { label: 'CM1', position: 'M', x: 0.3, y: 0.45 },
    { label: 'CM2', position: 'M', x: 0.5, y: 0.42 },
    { label: 'CM3', position: 'M', x: 0.7, y: 0.45 },
    { label: 'RWB', position: 'M', x: 0.9, y: 0.52 },
    { label: 'ST1', position: 'F', x: 0.38, y: 0.18 },
    { label: 'ST2', position: 'F', x: 0.62, y: 0.18 },
  ]),
  '4-2-3-1': mk('4-2-3-1', [
    { label: 'GK', position: 'G', x: 0.5, y: 0.92 },
    { label: 'LB', position: 'D', x: 0.15, y: 0.72 },
    { label: 'CB1', position: 'D', x: 0.38, y: 0.75 },
    { label: 'CB2', position: 'D', x: 0.62, y: 0.75 },
    { label: 'RB', position: 'D', x: 0.85, y: 0.72 },
    { label: 'CDM1', position: 'M', x: 0.35, y: 0.55 },
    { label: 'CDM2', position: 'M', x: 0.65, y: 0.55 },
    { label: 'LAM', position: 'M', x: 0.2, y: 0.32 },
    { label: 'CAM', position: 'M', x: 0.5, y: 0.3 },
    { label: 'RAM', position: 'M', x: 0.8, y: 0.32 },
    { label: 'ST', position: 'F', x: 0.5, y: 0.15 },
  ]),
};

export function playerPrice(rating: number): number {
  return Math.max(50, Math.round(rating * 12));
}

export function positionMatches(slotPos: string, playerPos: string): boolean {
  const p = playerPos.toUpperCase();
  if (slotPos === 'G') return p === 'G' || p.includes('GOAL');
  if (slotPos === 'D') return p === 'D' || p.includes('DEF');
  if (slotPos === 'M') return p === 'M' || p.includes('MID');
  if (slotPos === 'F') return p === 'F' || p.includes('ATT') || p.includes('FOR');
  return true;
}
