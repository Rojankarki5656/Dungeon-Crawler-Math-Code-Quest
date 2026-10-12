import type { DungeonMap, Monster, Vec2 } from '@/types/game';
import type { Camera } from './camera';
import { TILE_PX } from './tiles';
import { TILE } from './tile-constants';
import { HERO_FRAMES, MONSTER_SPRITE, type SpriteKey } from './sprites';
import { bobOffset } from './interpolate';
import { shade } from './palette';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scale: number;
  camera: Camera;
  map: DungeonMap;
  tileAtlas: Map<number, HTMLCanvasElement>;
  spriteAtlas: Map<string, HTMLCanvasElement>;
  players: Array<{ id: string; name: string; pos: Vec2; dir: keyof typeof HERO_FRAMES; walking: boolean; isSelf: boolean; hp: number; maxHp: number }>;
  monsters: Monster[];
  floatingTexts: Array<{ id: string; x: number; y: number; text: string; color: string; bornAt: number; ttl: number }>;
  time: number;
}

export function renderScene(rc: RenderContext) {
  const { ctx, width, height } = rc;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  // ---- Background fill (beyond map bounds) ----
  ctx.fillStyle = '#070a12';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(-Math.round(rc.camera.x), -Math.round(rc.camera.y));

  drawTiles(rc);
  drawMonsters(rc);
  drawPlayers(rc);
  drawFloatingTexts(rc);

  ctx.restore();

  drawVignette(ctx, width, height);
}

function drawTiles(rc: RenderContext) {
  const { ctx, camera, map, tileAtlas, scale, width, height } = rc;
  const ts = TILE_PX * scale;

  const startX = Math.max(0, Math.floor(camera.x / ts) - 1);
  const startY = Math.max(0, Math.floor(camera.y / ts) - 1);
  const endX = Math.min(map.width, Math.ceil((camera.x + width) / ts) + 1);
  const endY = Math.min(map.height, Math.ceil((camera.y + height) / ts) + 1);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const tile = map.tiles[y * map.width + x];
      const img = tileAtlas.get(tile) ?? tileAtlas.get(TILE.FLOOR)!;
      ctx.drawImage(img, x * ts, y * ts, ts, ts);
    }
  }
}

function drawMonsters(rc: RenderContext) {
  const { ctx, monsters, spriteAtlas, scale, time, map } = rc;
  const ts = TILE_PX * scale;

  for (const m of monsters) {
    if (m.hp <= 0) continue;
    if (m.x < -1 || m.y < -1 || m.x > map.width + 1 || m.y > map.height + 1) continue;

    const frames = MONSTER_SPRITE[m.archetype] ?? MONSTER_SPRITE.slime;
    const frame: SpriteKey = frames[Math.floor(time / 320 + m.x + m.y) % 2];
    const img = spriteAtlas.get(frame);
    if (!img) continue;

    const bob = Math.sin(time / 420 + m.x * 1.7 + m.y * 0.9) * (1.2 * scale);
    const px = m.x * ts + (ts - 8 * scale) / 2;
    const py = m.y * ts + (ts - 8 * scale) / 2 + bob;

    // Contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(m.x * ts + ts / 2, m.y * ts + ts - 2 * scale, ts * 0.32, ts * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(img, Math.round(px), Math.round(py), 8 * scale, 8 * scale);

    // HP bar above damaged monsters
    if (m.hp < m.maxHp) {
      const bw = ts - 4 * scale;
      const bh = Math.max(2, 1.5 * scale);
      const bx = m.x * ts + 2 * scale;
      const by = m.y * ts - bh - 2 * scale;
      const pct = Math.max(0, m.hp / m.maxHp);

      ctx.fillStyle = '#0b0f1a';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.22 ? '#ffd166' : '#e04141';
      ctx.fillRect(bx, by, Math.round(bw * pct), bh);
    }
  }
}

function drawPlayers(rc: RenderContext) {
  const { ctx, players, spriteAtlas, scale, time } = rc;
  const ts = TILE_PX * scale;

  const sorted = [...players].sort((a, b) => a.pos.y - b.pos.y);

  for (const p of sorted) {
    const frames = HERO_FRAMES[p.dir];
    const frameIdx = p.walking ? Math.floor(time / 130) % 2 : 0;
    const img = spriteAtlas.get(frames[frameIdx]);
    if (!img) continue;

    const px = p.pos.x * ts + (ts - 8 * scale) / 2;
    const py = p.pos.y * ts + (ts - 8 * scale) / 2 + bobOffset(time, p.walking);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(p.pos.x * ts + ts / 2, p.pos.y * ts + ts - 2 * scale, ts * 0.34, ts * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Self highlight ring
    if (p.isSelf) {
      ctx.strokeStyle = 'rgba(255,209,102,0.9)';
      ctx.lineWidth = Math.max(1, scale * 0.55);
      ctx.strokeRect(
        p.pos.x * ts + scale, p.pos.y * ts + scale,
        ts - scale * 2, ts - scale * 2,
      );
      ctx.fillStyle = 'rgba(255,209,102,0.10)';
      ctx.fillRect(p.pos.x * ts + scale, p.pos.y * ts + scale, ts - scale * 2, ts - scale * 2);
    }

    ctx.drawImage(img, Math.round(px), Math.round(py), 8 * scale, 8 * scale);

    // Name tag
    const label = p.isSelf ? `${p.name} (YOU)` : p.name;
    ctx.font = `${Math.max(7, 3 * scale)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(label, p.pos.x * ts + ts / 2 + 1, p.pos.y * ts - 3 * scale + 1);
    ctx.fillStyle = p.isSelf ? '#ffd166' : '#8fa3c8';
    ctx.fillText(label, p.pos.x * ts + ts / 2, p.pos.y * ts - 3 * scale);
  }
}

function drawFloatingTexts(rc: RenderContext) {
  const { ctx, floatingTexts, scale, time } = rc;
  const ts = TILE_PX * scale;

  for (const f of floatingTexts) {
    const age = time - f.bornAt;
    const pct = Math.min(1, age / f.ttl);
    const rise = pct * 26 * scale;
    const alpha = 1 - Math.pow(pct, 2.4);

    ctx.globalAlpha = alpha;
    ctx.font = `${Math.max(9, 4 * scale)}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillText(f.text, f.x * ts + ts / 2 + 2, f.y * ts - rise + 2);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x * ts + ts / 2, f.y * ts - rise);
    ctx.globalAlpha = 1;
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Draws a subtle grid overlay when `showGrid` is on (debug/design aid). */
export function drawGridOverlay(
  ctx: CanvasRenderingContext2D, camera: Camera, scale: number, w: number, h: number,
) {
  const ts = TILE_PX * scale;
  ctx.save();
  ctx.strokeStyle = 'rgba(127,178,255,0.09)';
  ctx.lineWidth = 1;
  for (let x = -camera.x % ts; x < w; x += ts) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = -camera.y % ts; y < h; y += ts) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

export { shade };