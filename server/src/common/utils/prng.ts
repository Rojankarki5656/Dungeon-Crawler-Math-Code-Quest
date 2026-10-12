/** mulberry32 — tiny, fast, deterministic. Same seed => same dungeon. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private readonly next: () => number;
  constructor(seed: number | string) {
    this.next = mulberry32(typeof seed === 'string' ? hashString(seed) : seed);
  }
  float(min = 0, max = 1) { return min + this.next() * (max - min); }
  int(min: number, max: number) { return Math.floor(this.float(min, max + 1)); }
  pick<T>(arr: readonly T[]): T { return arr[this.int(0, arr.length - 1)]; }
  chance(p: number) { return this.next() < p; }
}