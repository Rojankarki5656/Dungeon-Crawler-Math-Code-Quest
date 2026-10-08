const NS = 'dcq:';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch { /* quota */ }
  },
  remove(key: string) {
    try { localStorage.removeItem(NS + key); } catch { /* noop */ }
  },
};

export function getOrCreatePlayerId(): string {
  let id = storage.get<string | null>('playerId', null);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    storage.set('playerId', id);
  }
  return id;
}

export function getOrCreatePlayerName(): string {
  const names = ['ARCANE','BINARY','CIPHER','DELTA','ECHO','FLUX','GLYPH','HEX','ION','JINX','KILO','LAMBDA','NULL','OMEGA','PIXEL','QUARK'];
  let name = storage.get<string | null>('playerName', null);
  if (!name) {
    name = `${names[Math.floor(Math.random() * names.length)]}-${Math.floor(Math.random() * 900 + 100)}`;
    storage.set('playerName', name);
  }
  return name;
}