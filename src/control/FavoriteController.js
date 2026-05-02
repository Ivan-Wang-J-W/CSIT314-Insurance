import { api } from '../utils/api.js';
import { campaignToFSA } from '../utils/mappers.js';

export const FavoriteController = {
  async favoriteFSAs(doneeId) {
    const data = await api.get('/campaigns/favorites');
    return (data.campaigns || []).map(campaignToFSA);
  },

  async toggle(doneeId, fsaId) {
    const data = await api.post(`/campaigns/${fsaId}/favorite`, {});
    return data.saved;
  },

  async isFavorited(doneeId, fsaId) {
    const favs = await this.favoriteFSAs(doneeId);
    return favs.some((f) => f.id === fsaId);
  },
};
