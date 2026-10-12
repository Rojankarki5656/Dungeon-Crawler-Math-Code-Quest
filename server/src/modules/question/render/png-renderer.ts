import { PNG } from 'pngjs';
import { FONT_5X7, GLYPH_H, GLYPH_W } from './pixel-font';

export interface RenderOptions {
  /** Integer pixel scale — keeps everything crisp (no antialiasing). */
  scale?: number;
  padding?: number;
  bg?: [number, number, number, number];
  fg?: [number, number, number, number];
  accent?: [number, number, number, number];
  lineGap?: number;
  glyphGap?: number;
}

export interface RenderedPng {
  buffer: Buffer;
  width: number;
  height: number;
  etag: string;
}

/**
 * Deterministic PNG renderer — draws uppercase ASCII text onto a raw RGBA
 * buffer with a 5x7 bitmap font, then encodes with pngjs.
 * No native deps, no font files, fully reproducible output => stable ETags.
 */
export function renderQuestionPng(lines: string[], options: RenderOptions = {}): RenderedPng {
  const {
    scale = 4,
    padding = 10,
    bg = [11, 15, 26, 255],
    fg = [232, 241, 255, 255],
    accent = [255, 209, 102, 255],
    lineGap = 4,
    glyphGap = 1,
  } = options;

  const safeLines = lines.map((l) => l.toUpperCase());
  const maxCols = Math.max(1, ...safeLines.map((l) => l.length));
  const cols = maxCols;

  const contentW = cols * (GLYPH_W + glyphGap) * scale;
  const contentH = (safeLines.length * (GLYPH_H + lineGap) - lineGap) * scale;

  const width = contentW + padding * 2;
  const height = contentH + padding * 2;

  const png = new PNG({ width, height });

  // --- Background + outer pixel border ---------------------------------
  fillRect(png, 0, 0, width, height, bg);
  drawBorder(png, 0, 0, width, height, accent, 2 * scale, scale);

  // --- Glyphs ------------------------------------------------------------
  safeLines.forEach((line, lineIdx) => {
    const rowOffsetY = padding + lineIdx * (GLYPH_H + lineGap) * scale;
    // Center each line horizontally for a clean card look.
    const lineW = line.length * (GLYPH_W + glyphGap) * scale - glyphGap * scale;
    const rowOffsetX = Math.floor((width - lineW) / 2);

    for (let i = 0; i < line.length; i++) {
      const glyph = FONT_5X7[line[i]] ?? FONT_5X7['?'];
      const gx = rowOffsetX + i * (GLYPH_W + glyphGap) * scale;
      for (let ry = 0; ry < GLYPH_H; ry++) {
        const bits = glyph[ry];
        for (let rx = 0; rx < GLYPH_W; rx++) {
          if (bits[rx] !== '1') continue;
          fillRect(png, gx + rx * scale, rowOffsetY + ry * scale, scale, scale, fg);
        }
      }
    }
  });

  const buffer = PNG.sync.write(png, { colorType: 6, inputColorType: 6 });
  return { buffer, width, height, etag: `"png-${width}x${height}-${hashBuffer(buffer)}"` };
}

function fillRect(
  png: PNG, x: number, y: number, w: number, h: number, rgba: [number, number, number, number],
) {
  const [r, g, b, a] = rgba;
  const x0 = Math.max(0, x), y0 = Math.max(0, y);
  const x1 = Math.min(png.width, x + w), y1 = Math.min(png.height, y + h);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (png.width * py + px) << 2;
      png.data[idx] = r; png.data[idx + 1] = g;
      png.data[idx + 2] = b; png.data[idx + 3] = a;
    }
  }
}

function drawBorder(
  png: PNG, x: number, y: number, w: number, h: number,
  rgba: [number, number, number, number], thickness: number, dash: number,
) {
  for (let i = 0; i < thickness; i++) {
    for (let px = x; px < x + w; px++) {
      if (Math.floor(px / dash) % 2 === 0) {
        fillRect(png, px, y + i, 1, 1, rgba);
        fillRect(png, px, y + h - 1 - i, 1, 1, rgba);
      }
    }
    for (let py = y; py < y + h; py++) {
      if (Math.floor(py / dash) % 2 === 0) {
        fillRect(png, x + i, py, 1, 1, rgba);
        fillRect(png, x + w - 1 - i, py, 1, 1, rgba);
      }
    }
  }
}

function hashBuffer(buf: Buffer): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < buf.length; i += 7) {
    h ^= buf[i];
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}