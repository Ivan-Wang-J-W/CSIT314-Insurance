/**
 * CategoryController
 * CRUD for FSA categories (Platform Manager capability).
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { Category } from '../entity/Category.js';

export const CategoryController = {
  list() {
    return readCollection(KEYS.CATEGORIES).map((c) => new Category(c));
  },

  /** Only categories that are active — used when populating FSA creation form. */
  listActive() {
    return this.list().filter((c) => c.active);
  },

  getById(id) {
    const raw = readCollection(KEYS.CATEGORIES).find((c) => c.id === id);
    return raw ? new Category(raw) : null;
  },

  create({ name, description = '', icon = '', active = true }) {
    const existing = this.list();
    if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Category with this name already exists');
    }
    const category = new Category({ id: nextId('cat'), name, description, icon, active });
    writeCollection(KEYS.CATEGORIES, [...existing, { ...category }]);
    return category;
  },

  update(id, patch) {
    const items = readCollection(KEYS.CATEGORIES);
    const i = items.findIndex((c) => c.id === id);
    if (i < 0) throw new Error('Category not found');
    items[i] = { ...items[i], ...patch };
    writeCollection(KEYS.CATEGORIES, items);
    return new Category(items[i]);
  },

  delete(id) {
    // Prevent orphaning FSAs — block delete if any FSA still uses this category.
    const inUse = readCollection(KEYS.FSAS).some((f) => f.categoryId === id);
    if (inUse) throw new Error('Cannot delete category: it is used by one or more FSAs');
    writeCollection(KEYS.CATEGORIES, readCollection(KEYS.CATEGORIES).filter((c) => c.id !== id));
  },
};
