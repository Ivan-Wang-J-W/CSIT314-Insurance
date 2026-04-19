/**
 * FSAController
 * Business logic for Fund Raising Activities: CRUD, search/filter, analytics.
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { FSA, FSA_STATUS } from '../entity/FSA.js';

/** Coerce persisted records back into FSA instances so methods like progressPercent() work. */
const hydrate = (list) => list.map((f) => new FSA(f));

export const FSAController = {
  all() {
    return hydrate(readCollection(KEYS.FSAS));
  },

  getById(id) {
    const raw = readCollection(KEYS.FSAS).find((f) => f.id === id);
    return raw ? new FSA(raw) : null;
  },

  /**
   * Generic search: applies all filters, sort, and pagination.
   * Shared between Donee browse and Fundraiser history views.
   */
  search({
    q = '',
    categoryId = '',
    status = '',
    fundraiserId = '',
    from = '',
    to = '',
    sort = 'newest', // newest | ending | mostFunded | mostViewed
    page = 1,
    pageSize = 9,
  } = {}) {
    let list = this.all();

    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(needle) ||
          f.description.toLowerCase().includes(needle) ||
          (f.location || '').toLowerCase().includes(needle)
      );
    }
    if (categoryId) list = list.filter((f) => f.categoryId === categoryId);
    if (status) list = list.filter((f) => f.status === status);
    if (fundraiserId) list = list.filter((f) => f.fundraiserId === fundraiserId);
    if (from) list = list.filter((f) => new Date(f.createdAt) >= new Date(from));
    if (to) list = list.filter((f) => new Date(f.createdAt) <= new Date(to));

    const sorters = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      ending: (a, b) => new Date(a.endDate) - new Date(b.endDate),
      mostFunded: (a, b) => b.raisedAmount - a.raisedAmount,
      mostViewed: (a, b) => b.views - a.views,
    };
    list.sort(sorters[sort] || sorters.newest);

    const total = list.length;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total, page, pageSize };
  },

  create(data) {
    const items = readCollection(KEYS.FSAS);
    const entity = new FSA({
      id: nextId('fsa'),
      views: 0,
      shortlisted: 0,
      raisedAmount: 0,
      status: FSA_STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
      ...data,
    });
    writeCollection(KEYS.FSAS, [...items, { ...entity }]);
    return entity;
  },

  update(id, patch) {
    const items = readCollection(KEYS.FSAS);
    const i = items.findIndex((f) => f.id === id);
    if (i < 0) throw new Error('FSA not found');
    items[i] = { ...items[i], ...patch };
    writeCollection(KEYS.FSAS, items);
    return new FSA(items[i]);
  },

  delete(id) {
    writeCollection(KEYS.FSAS, readCollection(KEYS.FSAS).filter((f) => f.id !== id));
  },

  /** Bump view count — called when an FSA detail page is opened. */
  incrementViews(id) {
    const current = this.getById(id);
    if (!current) return;
    this.update(id, { views: current.views + 1 });
  },

  /** Adjust shortlist count when a donee favourites/unfavourites an FSA. */
  incrementShortlisted(id, delta = 1) {
    const current = this.getById(id);
    if (!current) return;
    this.update(id, { shortlisted: Math.max(0, current.shortlisted + delta) });
  },

  /** Dashboard analytics for a specific fundraiser. */
  analyticsFor(fundraiserId) {
    const list = this.all().filter((f) => f.fundraiserId === fundraiserId);
    return {
      total: list.length,
      active: list.filter((f) => f.status === FSA_STATUS.ACTIVE).length,
      completed: list.filter((f) => f.status === FSA_STATUS.COMPLETED).length,
      totalViews: list.reduce((sum, f) => sum + f.views, 0),
      totalShortlisted: list.reduce((sum, f) => sum + f.shortlisted, 0),
      totalRaised: list.reduce((sum, f) => sum + f.raisedAmount, 0),
      items: list,
    };
  },
};
