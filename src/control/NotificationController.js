/**
 * NotificationController
 * Per-user in-app notifications (bell icon + dropdown).
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { Notification, NOTIFICATION_TYPE } from '../entity/Notification.js';

export const NotificationController = {
  forUser(userId) {
    return readCollection(KEYS.NOTIFICATIONS)
      .filter((n) => n.userId === userId)
      .map((n) => new Notification(n))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  unreadCount(userId) {
    return this.forUser(userId).filter((n) => !n.read).length;
  },

  push({ userId, title, message, type = NOTIFICATION_TYPE.INFO, link = '' }) {
    const n = new Notification({
      id: nextId('n'), userId, title, message, type, link,
      read: false, createdAt: new Date().toISOString(),
    });
    writeCollection(KEYS.NOTIFICATIONS, [...readCollection(KEYS.NOTIFICATIONS), { ...n }]);
    return n;
  },

  markRead(id) {
    const items = readCollection(KEYS.NOTIFICATIONS);
    const i = items.findIndex((n) => n.id === id);
    if (i < 0) return;
    items[i] = { ...items[i], read: true };
    writeCollection(KEYS.NOTIFICATIONS, items);
  },

  markAllRead(userId) {
    const items = readCollection(KEYS.NOTIFICATIONS).map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    );
    writeCollection(KEYS.NOTIFICATIONS, items);
  },
};
