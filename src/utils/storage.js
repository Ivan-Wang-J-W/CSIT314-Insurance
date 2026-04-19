/**
 * Tiny localStorage wrapper with JSON (de)serialization + a seeder.
 *
 * Centralising this means every controller goes through the same code path —
 * easier to swap for a real API later (replace the body with fetch() calls).
 */
const PREFIX = 'frwa:';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(PREFIX + key);
  },
  clearAll() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },
};

/** Seed a collection only if it has never been written before. */
export function seedIfEmpty(key, initial) {
  if (storage.get(key) == null) storage.set(key, initial);
  return storage.get(key);
}
