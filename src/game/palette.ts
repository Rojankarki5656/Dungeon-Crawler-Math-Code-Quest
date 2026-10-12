export const PALETTE: Record<string, string> = {
  '.': 'transparent',
  '0': '#0b0f1a', '1': '#141b2d', '2': '#1d2740', '3': '#2a3550', '4': '#3d4d75',
  '5': '#55678a', '6': '#8fa3c8', '7': '#c8d8f0', '8': '#e8f1ff', '9': '#ffffff',
  a: '#2b6b3a', b: '#4caf50', c: '#8bd45a', d: '#1d4d7d', e: '#4a7fd4', f: '#7fb2ff',
  g: '#8b1a1a', h: '#e04141', i: '#ff8a8a', j: '#a06a35', k: '#d4a05a', l: '#ffd166',
  m: '#6b3f1d', n: '#f4a261', o: '#5a2d82', p: '#9c6bff', q: '#7f8c9b', r: '#b0bec5',
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amount)));
  return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
}