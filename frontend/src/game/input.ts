export type Direction = 'up' | 'down' | 'left' | 'right';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

export class InputManager {
  private readonly held = new Set<Direction>();
  private readonly listeners = new Set<(d: Direction) => void>();
  private attached = false;

  attach(target: HTMLElement | Window = window) {
    if (this.attached) return;
    this.attached = true;
    target.addEventListener('keydown', this.onKeyDown as EventListener);
    target.addEventListener('keyup', this.onKeyUp as EventListener);
    window.addEventListener('blur', this.onBlur);
  }

  detach(target: HTMLElement | Window = window) {
    target.removeEventListener('keydown', this.onKeyDown as EventListener);
    target.removeEventListener('keyup', this.onKeyUp as EventListener);
    window.removeEventListener('blur', this.onBlur);
    this.held.clear();
    this.attached = false;
  }

  onDirection(cb: (d: Direction) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  press(d: Direction) { this.emit(d); }
  isHeld(d: Direction) { return this.held.has(d); }

  /** Returns true when the user is currently typing in a form field. */
  private isTypingInField(e: KeyboardEvent): boolean {
    const t = e.target as HTMLElement | null;
    if (!t) return false;
    const tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if ((t as HTMLElement).isContentEditable) return true;
    return false;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // ✅ FIX: never intercept keystrokes meant for an input/textarea.
    if (this.isTypingInField(e)) return;

    const dir = KEY_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    if (this.held.has(dir)) return;
    this.held.add(dir);
    this.emit(dir);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (this.isTypingInField(e)) return;
    const dir = KEY_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    this.held.delete(dir);
  };

  private onBlur = () => this.held.clear();
  private emit(d: Direction) { for (const l of this.listeners) l(d); }
}