import { api } from '../utils/api.js';
import { backendToDonation } from '../utils/mappers.js';

export const DonationController = {
  async create({ fsaId, doneeId, amount, message, anonymous }) {
    const data = await api.post('/donations/', {
      campaign_id: fsaId,
      donee_id: doneeId,
      amount,
      message,
      anonymous,
    });
    return backendToDonation(data.donation);
  },

  async forFSA(fsaId) {
    const data = await api.get(`/campaigns/${fsaId}/donations`);
    return (data.donations || []).map(backendToDonation);
  },

  async forFundraiser(fundraiserId) {
    const { FSAController } = await import('./FSAController.js');
    const { items } = await FSAController.search({ fundraiserId, pageSize: 1000 });
    const groups = await Promise.all(items.map((f) => this.forFSA(f.id)));
    return groups.flat();
  },

  async searchForDonee(doneeId, { categoryId, from, to, page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (from) params.set('start_date', from);
    if (to) params.set('end_date', to);
    params.set('page', page);
    params.set('page_size', pageSize);
    const data = await api.get(`/donations/history?${params}`);
    return {
      items: (data.donations || []).map(backendToDonation),
      total: data.total || 0,
    };
  },
};
