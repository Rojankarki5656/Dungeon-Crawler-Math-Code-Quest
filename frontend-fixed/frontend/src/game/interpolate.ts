import type { Vec2 } from '@/types/game';

/**
 * Exponential smoothing towards a target.
 *
 * dt MUST be in seconds.
 *
 * Examples:
 * 60 FPS  -> ~0.0167
 * 30 FPS  -> ~0.0333
 * 144 FPS -> ~0.0069
 *
 * This makes the movement frame-rate independent.
 */
export function smoothTowards(
  current: Vec2,
  target: Vec2,
  dt: number,
  speed = 18
): Vec2 {
  // Protect against invalid/negative delta time.
  const safeDt = Math.max(0, dt);

  const t = 1 - Math.exp(-speed * safeDt);

  const nx =
    current.x +
    (target.x - current.x) * t;

  const ny =
    current.y +
    (target.y - current.y) * t;

  return {
    x:
      Math.abs(target.x - nx) < 0.002
        ? target.x
        : nx,

    y:
      Math.abs(target.y - ny) < 0.002
        ? target.y
        : ny,
  };
}

/**
 * Bobbing offset for idle/walking animation.
 *
 * t is expected to be milliseconds,
 * such as performance.now().
 */
export function bobOffset(
  t: number,
  walking: boolean
): number {
  if (!walking) {
    return Math.sin(t * 0.0022) * 0.9;
  }

  return (
    Math.abs(Math.sin(t * 0.012)) * -2.2
  );
}
