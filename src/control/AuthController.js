/**
 * AuthController
 * Handles login, logout, registration, and current-session persistence.
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { storage } from '../utils/storage.js';
import { User, ROLES } from '../entity/User.js';

export const AuthController = {
  /** Check credentials and persist the session; returns a safe User or throws. */
  login(username, password) {
    const users = readCollection(KEYS.USERS);
    const match = users.find(
      (u) => (u.username === username || u.email === username) && u.password === password
    );
    if (!match) throw new Error('Invalid username or password');
    if (match.status === 'SUSPENDED') throw new Error('Your account has been suspended');

    const entity = new User(match);
    storage.set(KEYS.SESSION, { userId: entity.id });
    return entity.toSafeObject();
  },

  logout() {
    storage.remove(KEYS.SESSION);
  },

  /** Returns a safe User hydrated from the stored session, or null. */
  currentUser() {
    const session = storage.get(KEYS.SESSION);
    if (!session?.userId) return null;
    const raw = readCollection(KEYS.USERS).find((u) => u.id === session.userId);
    return raw ? new User(raw).toSafeObject() : null;
  },

  /** Register a new Donee/Fundraiser account. Admin/PM are provisioned manually. */
  register({ username, email, password, fullName, role = ROLES.DONEE, phone = '' }) {
    if (![ROLES.DONEE, ROLES.FUNDRAISER].includes(role)) {
      throw new Error('Only Donee or Fundraiser accounts can self-register');
    }
    const users = readCollection(KEYS.USERS);
    if (users.some((u) => u.username === username)) throw new Error('Username already taken');
    if (users.some((u) => u.email === email)) throw new Error('Email already registered');

    const user = new User({
      id: nextId('u'),
      username, email, password, fullName, role, phone,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
    writeCollection(KEYS.USERS, [...users, { ...user }]);
    storage.set(KEYS.SESSION, { userId: user.id });
    return user.toSafeObject();
  },
};
