/**
 * UserController
 * Admin-facing user management: list, search, suspend/reactivate, delete, create.
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { User, ROLES } from '../entity/User.js';

export const UserController = {
  list() {
    return readCollection(KEYS.USERS).map((u) => new User(u).toSafeObject());
  },

  /** Filter + paginate users for the admin table. */
  search({ q = '', role = '', status = '', page = 1, pageSize = 10 } = {}) {
    let list = this.list();
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle) ||
          (u.fullName || '').toLowerCase().includes(needle)
      );
    }
    if (role) list = list.filter((u) => u.role === role);
    if (status) list = list.filter((u) => u.status === status);

    const total = list.length;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total };
  },

  getById(id) {
    const raw = readCollection(KEYS.USERS).find((u) => u.id === id);
    return raw ? new User(raw).toSafeObject() : null;
  },

  create(data) {
    const users = readCollection(KEYS.USERS);
    if (users.some((u) => u.username === data.username)) throw new Error('Username already taken');
    if (users.some((u) => u.email === data.email)) throw new Error('Email already registered');
    const user = new User({
      id: nextId('u'),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      role: ROLES.DONEE,
      ...data,
    });
    writeCollection(KEYS.USERS, [...users, { ...user }]);
    return user.toSafeObject();
  },

  update(id, patch) {
    const users = readCollection(KEYS.USERS);
    const i = users.findIndex((u) => u.id === id);
    if (i < 0) throw new Error('User not found');
    users[i] = { ...users[i], ...patch };
    writeCollection(KEYS.USERS, users);
    return new User(users[i]).toSafeObject();
  },

  /** Toggle ACTIVE ↔ SUSPENDED. Keeps an audit-friendly single entry point. */
  toggleStatus(id) {
    const current = this.getById(id);
    if (!current) throw new Error('User not found');
    return this.update(id, { status: current.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
  },

  delete(id) {
    const users = readCollection(KEYS.USERS).filter((u) => u.id !== id);
    writeCollection(KEYS.USERS, users);
  },

  stats() {
    const users = this.list();
    return {
      total: users.length,
      byRole: Object.fromEntries(
        Object.values(ROLES).map((r) => [r, users.filter((u) => u.role === r).length])
      ),
      active: users.filter((u) => u.status === 'ACTIVE').length,
      suspended: users.filter((u) => u.status === 'SUSPENDED').length,
    };
  },
};
