/**
 * 8x8 pixel sprites — string rows mapped through PALETTE.
 * Every sprite is drawn into an offscreen canvas ONCE at boot and then
 * blitted with drawImage, keeping the render loop allocation-free.
 */
import { PALETTE } from './palette';

export const SPRITES = {
  /* ---------------- HERO ---------------- */
  hero_down_0: [
    '..0000..',
    '.077770.',
    '07877870',
    '07888870',
    '0e7777e0',
    '.0dddd0.',
    '.0d00d0.',
    '..0..0..',
  ],
  hero_down_1: [
    '..0000..',
    '.077770.',
    '07877870',
    '07888870',
    '0e7777e0',
    '.0dddd0.',
    '.d0..0d.',
    '.0....0.',
  ],
  hero_up_0: [
    '..0000..',
    '.077770.',
    '07777770',
    '07888870',
    '0e7777e0',
    '.0dddd0.',
    '.0d00d0.',
    '..0..0..',
  ],
  hero_up_1: [
    '..0000..',
    '.077770.',
    '07777770',
    '07888870',
    '0e7777e0',
    '.0dddd0.',
    '.d0..0d.',
    '.0....0.',
  ],
  hero_left_0: [
    '..0000..',
    '.077770.',
    '07877770',
    '07888800',
    '0e7777e0',
    '.0dddd0.',
    '.0d00d..',
    '..0..0..',
  ],
  hero_left_1: [
    '..0000..',
    '.077770.',
    '07877770',
    '07888800',
    '0e7777e0',
    '.0dddd0.',
    '..d00d..',
    '.0....0.',
  ],
  hero_right_0: [
    '..0000..',
    '.077770.',
    '07777870',
    '00888870',
    '0e7777e0',
    '.0dddd0.',
    '..d00d0.',
    '..0..0..',
  ],
  hero_right_1: [
    '..0000..',
    '.077770.',
    '07777870',
    '00888870',
    '0e7777e0',
    '.0dddd0.',
    '..d00d..',
    '.0....0.',
  ],

  /* ---------------- MONSTERS ---------------- */
  slime_0: ['........','..aaaa..','.abbbba.','abccccba','abccccba','abbbbbba','0a0000a0','..0..0..'],
  slime_1: ['........','........','..aaaa..','.abbbba.','abccccba','abbbbbba','0a0000a0','..0..0..'],

  bat_0:   ['........','.0....0.','0o0..0o0','0opo0op0','.0oppo0.','..0oo0..','...00...','........'],
  bat_1:   ['........','........','.0....0.','0o0..0o0','0opooop0','.0oppo0.','...00...','........'],

  orc_0:   ['..0000..','.0aaaa0.','0abccba0','0abcdba0','0abccba0','.0aaaa0.','.0a00a0.','..0..0..'],
  orc_1:   ['..0000..','.0aaaa0.','0abccba0','0abcdba0','0abccba0','.0aaaa0.','.0a00a0.','.0....0.'],

  golem_0: ['..0000..','.0qqqq0.','0qrrrrq0','0qr00rq0','0qrrrrq0','0qrrrrq0','.0qqqq0.','..0..0..'],
  golem_1: ['..0000..','.0qqqq0.','0qrrrrq0','0qr00rq0','0qrrrrq0','0qrrrrq0','.0qqqq0.','.0....0.'],

  warden_0:['..0000..','.0gggg0.','0ghiihg0','0gh00hg0','0ghiihg0','0gggggg0','.0g00g0.','.0g..g0.'],
  warden_1:['..0000..','.0gggg0.','0ghiihg0','0gh00hg0','0ghiihg0','0gggggg0','.0g00g0.','..0..0..'],

  /* ---------------- OBJECTS ---------------- */
  door:    ['00000000','0mmmmmm0','0m0ll0m0','0ml00lm0','0ml00lm0','0m0ll0m0','0mmmmmm0','00000000'],
  chest:   ['........','00000000','0kkkkkk0','0k00llk0','0kkkkkk0','0kmmmmk0','0kkkkkk0','00000000'],
  exit:    ['00000000','0l0l0l0l','00l0l0l0','0l0l0l0l','00l0l0l0','0l0l0l0l','00l0l0l0','00000000'],
} as const;

export type SpriteKey = keyof typeof SPRITES;

export const MONSTER_SPRITE: Record<string, [SpriteKey, SpriteKey]> = {
  slime:  ['slime_0',  'slime_1'],
  bat:    ['bat_0',    'bat_1'],
  orc:    ['orc_0',    'orc_1'],
  golem:  ['golem_0',  'golem_1'],
  warden: ['warden_0', 'warden_1'],
};

export const HERO_FRAMES: Record<'down' | 'up' | 'left' | 'right', [SpriteKey, SpriteKey]> = {
  down:  ['hero_down_0',  'hero_down_1'],
  up:    ['hero_up_0',    'hero_up_1'],
  left:  ['hero_left_0',  'hero_left_1'],
  right: ['hero_right_0', 'hero_right_1'],
};

/** Renders every sprite into its own tiny canvas at 8x8 pixels. */
export function bakeSpriteAtlas(px = 8): Map<string, HTMLCanvasElement> {
  const atlas = new Map<string, HTMLCanvasElement>();
  for (const [name, rows] of Object.entries(SPRITES)) {
    const c = document.createElement('canvas');
    c.width = px; c.height = px;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const color = PALETTE[row[x]];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    atlas.set(name, c);
  }
  return atlas;
}