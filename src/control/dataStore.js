/**
 * Central mock data store.
 * Seeds localStorage from src/data/seed.js on first load, then every
 * controller reads/writes through here so writes survive refreshes.
 */
import * as seed from '../data/seed.js';
import { storage, seedIfEmpty } from '../utils/storage.js';

export const KEYS = {
  USERS: 'users',
  FSAS: 'fsas',
  DONATIONS: 'donations',
  FAVORITES: 'favorites',
  CATEGORIES: 'categories',
  NOTIFICATIONS: 'notifications',
  SESSION: 'session',
};

/** Initialise localStorage with seed data the first time the app runs. */
export function initDataStore() {
  seedIfEmpty(KEYS.USERS, seed.users);
  seedIfEmpty(KEYS.FSAS, seed.fsas);
  seedIfEmpty(KEYS.DONATIONS, seed.donations);
  seedIfEmpty(KEYS.FAVORITES, seed.favorites);
  seedIfEmpty(KEYS.CATEGORIES, seed.categories);
  seedIfEmpty(KEYS.NOTIFICATIONS, seed.notifications);
}

/** Reset the mock DB — handy during development and in Admin → Reset Demo. */
export function resetDataStore() {
  Object.values(KEYS).forEach((k) => storage.remove(k));
  initDataStore();
}

export const readCollection = (key) => storage.get(key, []);
export const writeCollection = (key, value) => storage.set(key, value);

/** Generate a semi-unique id prefixed with the entity kind. */
export const nextId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
