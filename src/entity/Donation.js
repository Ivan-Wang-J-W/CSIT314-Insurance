/**
 * Donation Entity
 * A single contribution from a Donee to an FSA.
 */
export class Donation {
  constructor({
    id,
    fsaId,
    doneeId,
    amount,
    message = '',
    anonymous = false,
    createdAt = new Date().toISOString(),
  }) {
    this.id = id;
    this.fsaId = fsaId;
    this.doneeId = doneeId;
    this.amount = Number(amount);
    this.message = message;
    this.anonymous = anonymous;
    this.createdAt = createdAt;
  }

  static fromJSON(raw) {
    return new Donation(raw);
  }
}
