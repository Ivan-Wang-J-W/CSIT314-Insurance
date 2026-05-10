import { api } from '../utils/api.js';
import { campaignToFSA, fsaToPayload } from '../utils/mappers.js';

export const FSAController = {
  async search({ q, categoryId, fundraiserId, status, from, to, page = 1, pageSize = 12 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId) params.set('category', categoryId);
    if (fundraiserId) params.set('fundraiser_id', fundraiserId);
    if (status) params.set('status', status);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', page);
    params.set('page_size', pageSize);
    const data = await api.get(`/campaigns/?${params}`);
    return {
      items: (data.campaigns || []).map(campaignToFSA),
      total: data.total || 0,
    };
  },

  async getById(id) {
    const data = await api.get(`/campaigns/${id}`);
    return campaignToFSA(data.campaign);
  },

  async create(payload) {
    const data = await api.post('/campaigns/', fsaToPayload(payload));
    return campaignToFSA(data.campaign);
  },

  async update(id, payload) {
    const data = await api.put(`/campaigns/${id}`, fsaToPayload(payload));
    return campaignToFSA(data.campaign);
  },

  async delete(id) {
    await api.del(`/campaigns/${id}`);
  },

  async approve(id) {
    const data = await api.post(`/campaigns/${id}/approve`, {});
    return campaignToFSA(data.campaign);
  },

  async reject(id, remarks) {
    const data = await api.post(`/campaigns/${id}/reject`, { remarks });
    return campaignToFSA(data.campaign);
  },

  async suspend(id) {
    const data = await api.post(`/campaigns/${id}/suspend`, {});
    return campaignToFSA(data.campaign);
  },

  async searchHistory({ q, status } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    const data = await api.get(`/campaigns/history?${params}`);
    return (data.campaigns || []).map(campaignToFSA);
  },

  async analyticsFor(fundraiserId) {
    const { items } = await this.search({ fundraiserId, pageSize: 1000 });
    return {
      total: items.length,
      active: items.filter((f) => f.status === 'ACTIVE').length,
      completed: items.filter((f) => f.status === 'COMPLETED').length,
      totalViews: items.reduce((s, f) => s + (f.views || 0), 0),
      totalShortlisted: items.reduce((s, f) => s + (f.shortlisted || 0), 0),
      totalRaised: items.reduce((s, f) => s + (f.raisedAmount || 0), 0),
      items,
    };
  },
};
