/**
 * Favorite Entity
 * Tracks which FSAs a Donee has bookmarked. Each record is a (doneeId, fsaId) pair.
 */
export class Favorite {
  constructor({ id, doneeId, fsaId, createdAt = new Date().toISOString() }) {
    this.id = id;
    this.doneeId = doneeId;
    this.fsaId = fsaId;
    this.createdAt = createdAt;
  }

  static fromJSON(raw) {
    return new Favorite(raw);
  }
}
