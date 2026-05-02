import { api } from '../utils/api.js';
import { backendToUser, userToPayload } from '../utils/mappers.js';

export const UserController = {
  async search({ q, role, status, page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    params.set('page', page);
    params.set('page_size', pageSize);
    const data = await api.get(`/admin/users?${params}`);
    return {
      items: (data.users || []).map(backendToUser),
      total: data.total || 0,
    };
  },

  async update(id, payload) {
    try {
      const data = await api.put('/auth/me', userToPayload(payload));
      return backendToUser(data.user);
    } catch {
      const data = await api.put(`/admin/users/${id}`, userToPayload(payload));
      return backendToUser(data.user);
    }
  },

  async toggleStatus(id) {
    const data = await api.post(`/admin/users/${id}/toggle-status`, {});
    return backendToUser(data.user);
  },

  async delete(id) {
    await api.del(`/admin/users/${id}`);
  },

  async stats() {
    const { items } = await this.search({ pageSize: 1000 });
    const byRole = {};
    items.forEach((u) => { byRole[u.role] = (byRole[u.role] || 0) + 1; });
    return {
      total: items.length,
      active: items.filter((u) => u.status === 'ACTIVE').length,
      suspended: items.filter((u) => u.status === 'SUSPENDED').length,
      byRole,
    };
  },
};
