export type GenerationNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Selection = GenerationNumber | 'all';

export const GENERATION_RANGES: Record<GenerationNumber, [number, number]> = {
  1: [1, 151],
  2: [152, 251],
  3: [252, 386],
  4: [387, 493],
  5: [494, 649],
  6: [650, 721],
  7: [722, 809],
  8: [810, 905],
  9: [906, 1025],
};

export const MAX_DEX_ID = 1025;

export function generationForId(id: number): GenerationNumber {
  for (const [gen, [lo, hi]] of Object.entries(GENERATION_RANGES)) {
    if (id >= lo && id <= hi) return Number(gen) as GenerationNumber;
  }
  throw new Error(`No generation mapped for dex id ${id}`);
}

export function selectionKey(selection: Selection): string {
  return selection === 'all' ? 'all' : `gen${selection}`;
}
