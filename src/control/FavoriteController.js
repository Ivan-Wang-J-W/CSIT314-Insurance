/**
 * FavoriteController
 * Bookmark management for Donees. Each favourite is a (doneeId, fsaId) pair.
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { Favorite } from '../entity/Favorite.js';
import { FSAController } from './FSAController.js';

export const FavoriteController = {
  listForDonee(doneeId) {
    return readCollection(KEYS.FAVORITES).filter((f) => f.doneeId === doneeId).map((f) => new Favorite(f));
  },

  isFavorited(doneeId, fsaId) {
    return readCollection(KEYS.FAVORITES).some((f) => f.doneeId === doneeId && f.fsaId === fsaId);
  },

  /**
   * Flip favourite state. Keeps FSA.shortlisted in sync so the Fundraiser
   * analytics view reflects real interest.
   */
  toggle(doneeId, fsaId) {
    const items = readCollection(KEYS.FAVORITES);
    const existing = items.find((f) => f.doneeId === doneeId && f.fsaId === fsaId);
    if (existing) {
      writeCollection(KEYS.FAVORITES, items.filter((f) => f.id !== existing.id));
      FSAController.incrementShortlisted(fsaId, -1);
      return false;
    }
    const fav = new Favorite({ id: nextId('fav'), doneeId, fsaId });
    writeCollection(KEYS.FAVORITES, [...items, { ...fav }]);
    FSAController.incrementShortlisted(fsaId, +1);
    return true;
  },

  /** Resolve favourites into full FSA records — used by the Favorites page. */
  favoriteFSAs(doneeId) {
    const favs = this.listForDonee(doneeId);
    const ids = new Set(favs.map((f) => f.fsaId));
    return FSAController.all().filter((f) => ids.has(f.id));
  },
};
