import type { Vec2 } from '@/types/game';

export class Camera {
  x = 0; y = 0;
  targetX = 0; targetY = 0;
  private readonly lerpFactor = 0.14;

  follow(target: Vec2, tilePx: number, scale: number, viewW: number, viewH: number) {
    const worldX = target.x * tilePx * scale + (tilePx * scale) / 2;
    const worldY = target.y * tilePx * scale + (tilePx * scale) / 2;
    const marginX = viewW * 0.3;
    const marginY = viewH * 0.3;

    // Keep the player in a generous screen-space dead zone instead of
    // recentering the camera on every tile, which makes movement look stuck.
    const screenX = worldX - this.x;
    const screenY = worldY - this.y;
    if (screenX < marginX) this.targetX = worldX - marginX;
    else if (screenX > viewW - marginX) this.targetX = worldX - (viewW - marginX);
    if (screenY < marginY) this.targetY = worldY - marginY;
    else if (screenY > viewH - marginY) this.targetY = worldY - (viewH - marginY);
  }

  update() {
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;
    // Snap when very close to avoid sub-pixel shimmer.
    if (Math.abs(this.targetX - this.x) < 0.4) this.x = this.targetX;
    if (Math.abs(this.targetY - this.y) < 0.4) this.y = this.targetY;
  }

  snap() { this.x = this.targetX; this.y = this.targetY; }

  clamp(worldW: number, worldH: number, viewW: number, viewH: number) {
    this.x = Math.max(0, Math.min(worldW - viewW, this.x));
    this.y = Math.max(0, Math.min(worldH - viewH, this.y));
    if (worldW < viewW) this.x = (worldW - viewW) / 2;
    if (worldH < viewH) this.y = (worldH - viewH) / 2;
  }
}