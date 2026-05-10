import { api } from '../utils/api.js';
import { backendToNotification } from '../utils/mappers.js';

export const NotificationController = {
  async forUser(userId) {
    const data = await api.get('/donations/notifications');
    return (data.notifications || []).map(backendToNotification);
  },

  async markRead(id) {
    await api.post(`/donations/notifications/${id}/read`, {});
  },

  async markAllRead(userId) {
    await api.post('/donations/notifications/read-all', {});
  },

  push() {}, // no-op: notifications are created server-side
};
