import { TILE } from './tile-constants';

export const TILE_PX = 16;

/** Procedural tile patterns drawn once into a tile atlas. */
export function bakeTileAtlas(tilePx = TILE_PX): Map<number, HTMLCanvasElement> {
  const atlas = new Map<number, HTMLCanvasElement>();

  const make = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = tilePx; c.height = tilePx;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    return c;
  };

  // ---- FLOOR: stone slab with dithering ----
  atlas.set(TILE.FLOOR, make((ctx) => {
    ctx.fillStyle = '#1d2740'; ctx.fillRect(0, 0, tilePx, tilePx);
    ctx.fillStyle = '#243154';
    for (let y = 0; y < tilePx; y += 2) {
      for (let x = 0; x < tilePx; x += 2) {
        if ((x + y) % 4 === 0) ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = '#151d33';
    ctx.fillRect(0, tilePx - 1, tilePx, 1);
    ctx.fillRect(tilePx - 1, 0, 1, tilePx);
    ctx.fillStyle = '#2a3550';
    ctx.fillRect(0, 0, tilePx, 1);
    ctx.fillRect(0, 0, 1, tilePx);
  }));

  // ---- WALL: brick ----
  atlas.set(TILE.WALL, make((ctx) => {
    ctx.fillStyle = '#0f1526'; ctx.fillRect(0, 0, tilePx, tilePx);
    ctx.fillStyle = '#2f3d63';
    const bh = 4, bw = 8;
    for (let row = 0; row < tilePx / bh; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let x = -bw; x < tilePx; x += bw) {
        ctx.fillRect(x + offset + 1, row * bh + 1, bw - 2, bh - 2);
      }
    }
    ctx.fillStyle = '#455a8f';
    for (let row = 0; row < tilePx / bh; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let x = -bw; x < tilePx; x += bw) {
        ctx.fillRect(x + offset + 1, row * bh + 1, bw - 2, 1);
      }
    }
  }));

  // ---- MONSTER FLOOR: blood-tinged floor marker ----
  atlas.set(TILE.MONSTER, make((ctx) => {
    ctx.drawImage(atlas.get(TILE.FLOOR)!, 0, 0);
    ctx.fillStyle = 'rgba(139,26,26,0.35)';
    ctx.fillRect(3, 3, tilePx - 6, tilePx - 6);
    ctx.fillStyle = 'rgba(224,65,65,0.5)';
    ctx.fillRect(5, 5, 2, 2); ctx.fillRect(tilePx - 7, 5, 2, 2);
    ctx.fillRect(5, tilePx - 7, 2, 2); ctx.fillRect(tilePx - 7, tilePx - 7, 2, 2);
  }));

  // ---- DOOR ----
  atlas.set(TILE.DOOR, make((ctx) => {
    ctx.drawImage(atlas.get(TILE.FLOOR)!, 0, 0);
    ctx.fillStyle = '#6b3f1d'; ctx.fillRect(2, 1, tilePx - 4, tilePx - 2);
    ctx.fillStyle = '#a06a35'; ctx.fillRect(3, 2, tilePx - 6, tilePx - 4);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(tilePx - 6, tilePx / 2, 2, 2);
    ctx.fillStyle = '#0b0f1a'; ctx.fillRect(2, 1, tilePx - 4, 1);
  }));

  // ---- CHEST ----
  atlas.set(TILE.CHEST, make((ctx) => {
    ctx.drawImage(atlas.get(TILE.FLOOR)!, 0, 0);
    ctx.fillStyle = '#8b5a1a'; ctx.fillRect(2, 5, tilePx - 4, tilePx - 7);
    ctx.fillStyle = '#d4a05a'; ctx.fillRect(3, 6, tilePx - 6, tilePx - 9);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(tilePx / 2 - 1, 8, 2, 3);
    ctx.fillStyle = '#0b0f1a'; ctx.fillRect(2, 4, tilePx - 4, 1);
  }));

  // ---- EXIT PORTAL ----
  atlas.set(TILE.EXIT, make((ctx) => {
    ctx.fillStyle = '#0b0f1a'; ctx.fillRect(0, 0, tilePx, tilePx);
    for (let i = 0; i < 5; i++) {
      const inset = i * 1.5;
      ctx.fillStyle = ['#2b6b3a', '#4caf50', '#8bd45a', '#ffd166', '#e8f1ff'][i];
      ctx.fillRect(inset, inset, tilePx - inset * 2, tilePx - inset * 2);
    }
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(3, 3, tilePx - 6, tilePx - 6);
  }));

  return atlas;
}