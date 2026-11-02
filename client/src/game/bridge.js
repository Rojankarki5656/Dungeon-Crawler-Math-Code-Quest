class Emitter {
  constructor() { this.listeners = new Map(); }
  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  off(evt, fn) { this.listeners.get(evt)?.delete(fn); }
  emit(evt, ...args) {
    this.listeners.get(evt)?.forEach((fn) => {
      try { fn(...args); } catch (e) { console.error(e); }
    });
  }
}

/**
 * React ⇄ Phaser event bridge.
 *
 * Phaser → React:
 *   'near-monster'     { instanceId, name }
 *   'leave-monster'    {}
 *   'request-fight'    { instanceId }        (SPACE pressed near monster)
 *   'dungeon-cleared'  {}
 *
 * React → Phaser:
 *   'combat-open'      {}                     freeze movement
 *   'combat-close'     {}                     unfreeze movement
 *   'monster-updated'  { instanceId, currentHp, maxHp, defeated }
 *   'monster-defeated' { instanceId }
 *   'remote-moved'     { userId, x, y }
 *   'remote-joined'    { user, position }
 *   'remote-left'      { userId }
 */
export const bridge = new Emitter();