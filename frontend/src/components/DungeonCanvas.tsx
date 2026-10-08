import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '@/state/store';
import { Camera } from '@/game/camera';
import { renderScene, drawGridOverlay } from '@/game/renderer';
import { bakeSpriteAtlas } from '@/game/sprites';
import { bakeTileAtlas } from '@/game/tiles';
import { smoothTowards } from '@/game/interpolate';
import { useAnimationFrame } from '@/hooks/useAnimationFrame';
import { ENV } from '@/config/env';
import type { Direction } from '@/game/input';

interface Props {
  directionRef: React.MutableRefObject<Direction>;
  showGrid?: boolean;
}

export function DungeonCanvas({ directionRef, showGrid = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(new Camera());
  const lastDirRef = useRef<Record<string, Direction>>({});
  const prevPosRef = useRef<Record<string, { x: number; y: number }>>({});
  const timeRef = useRef(0);

  const spriteAtlas = useMemo(() => bakeSpriteAtlas(8), []);
  const tileAtlas = useMemo(() => bakeTileAtlas(ENV.TILE_PX), []);

  // ---- Resize handling (DPR-aware) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener('orientationchange', resize);
    return () => { ro.disconnect(); window.removeEventListener('orientationchange', resize); };
  }, []);

  // ---- Render loop ----
  useAnimationFrame((dt, now) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = useGameStore.getState();
    if (!s.lobby?.map) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const viewW = canvas.width / dpr;
    const viewH = canvas.height / dpr;
    const scale = ENV.DEFAULT_SCALE;

    timeRef.current = now;

    // ---- Interpolate render positions ----
    const renderPos = { ...s.renderPos };
    const interpolated: Record<string, { x: number; y: number }> = {};
    for (const p of Object.values(s.players)) {
      const current = renderPos[p.id] ?? { x: p.x, y: p.y };
      interpolated[p.id] = smoothTowards(current, { x: p.x, y: p.y }, dt, 16);
    }

    // ---- Derive facing + walking state ----
    const selfId = s.selfId;
    const players = Object.values(s.players).map((p) => {
      const prev = prevPosRef.current[p.id];
      const cur = interpolated[p.id] ?? { x: p.x, y: p.y };
      const walking = prev
        ? Math.abs(cur.x - prev.x) > 0.02 || Math.abs(cur.y - prev.y) > 0.02
        : false;

      let dir: Direction = p.lastDir ?? lastDirRef.current[p.id] ?? 'down';
      if (prev) {
        const dx = cur.x - prev.x;
        const dy = cur.y - prev.y;
        if (!p.lastDir && (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)) {
          dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          lastDirRef.current[p.id] = dir;
        }
      }
      prevPosRef.current[p.id] = cur;

      return {
        id: p.id, name: p.name,
        pos: cur,
        dir,
        walking,
        isSelf: p.id === selfId,
        hp: p.hp, maxHp: p.maxHp,
      };
    });

    // ---- Camera follows self ----
    const selfPos = selfId ? interpolated[selfId] : null;
    const camera = cameraRef.current;
    if (selfPos) camera.follow(selfPos, ENV.TILE_PX, scale, viewW, viewH);
    camera.update();
    camera.clamp(s.lobby.map.width * ENV.TILE_PX * scale, s.lobby.map.height * ENV.TILE_PX * scale, viewW, viewH);

    // ---- Prune expired floating texts ----
    s.pruneFloatingTexts(now);

    // ---- Shake offset ----
    let shakeX = 0, shakeY = 0;
    if (s.shakeUntil > now) {
      const t = (s.shakeUntil - now) / 260;
      shakeX = (Math.random() - 0.5) * 10 * t * scale;
      shakeY = (Math.random() - 0.5) * 10 * t * scale;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    renderScene({
      ctx, width: viewW, height: viewH, scale, camera,
      map: s.lobby.map,
      tileAtlas, spriteAtlas,
      players,
      monsters: s.monsters,
      floatingTexts: s.floatingTexts,
      time: now,
    });

    if (showGrid) drawGridOverlay(ctx, camera, scale, viewW, viewH);
    ctx.restore();
  }, true);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-px-bg">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* CRT scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)' }}
      />
    </div>
  );
}