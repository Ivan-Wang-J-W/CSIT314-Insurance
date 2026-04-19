/**
 * DonationController
 * Handles donation creation and querying donation history.
 * Donating also updates the parent FSA's raised amount — single source of truth.
 */
import { KEYS, readCollection, writeCollection, nextId } from './dataStore.js';
import { Donation } from '../entity/Donation.js';
import { FSAController } from './FSAController.js';
import { FSA_STATUS } from '../entity/FSA.js';

const hydrate = (list) => list.map((d) => new Donation(d));

export const DonationController = {
  all() {
    return hydrate(readCollection(KEYS.DONATIONS));
  },

  /**
   * Create a donation.
   * Side-effects: bumps FSA.raisedAmount and auto-completes FSA when goal is hit.
   */
  create({ fsaId, doneeId, amount, message = '', anonymous = false }) {
    const fsa = FSAController.getById(fsaId);
    if (!fsa) throw new Error('FSA not found');
    if (fsa.status !== FSA_STATUS.ACTIVE) throw new Error('This FSA is not accepting donations');
    if (!amount || amount <= 0) throw new Error('Donation amount must be positive');

    const donation = new Donation({
      id: nextId('don'), fsaId, doneeId,
      amount: Number(amount), message, anonymous,
      createdAt: new Date().toISOString(),
    });

    writeCollection(KEYS.DONATIONS, [...readCollection(KEYS.DONATIONS), { ...donation }]);

    const newRaised = fsa.raisedAmount + Number(amount);
    FSAController.update(fsaId, {
      raisedAmount: newRaised,
      status: newRaised >= fsa.goalAmount ? FSA_STATUS.COMPLETED : fsa.status,
    });
    return donation;
  },

  /** Search donations made by a specific donee, with filtering for history view. */
  searchForDonee(doneeId, { categoryId = '', from = '', to = '', page = 1, pageSize = 10 } = {}) {
    let list = this.all().filter((d) => d.doneeId === doneeId);

    if (categoryId) {
      // Category filter joins through the FSA record.
      const fsas = FSAController.all();
      const ids = new Set(fsas.filter((f) => f.categoryId === categoryId).map((f) => f.id));
      list = list.filter((d) => ids.has(d.fsaId));
    }
    if (from) list = list.filter((d) => new Date(d.createdAt) >= new Date(from));
    if (to) list = list.filter((d) => new Date(d.createdAt) <= new Date(to));

    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = list.length;
    const start = (page - 1) * pageSize;
    return { items: list.slice(start, start + pageSize), total };
  },

  /** Donations received by FSAs owned by a fundraiser — used in FR analytics. */
  forFundraiser(fundraiserId) {
    const fsaIds = new Set(
      FSAController.all().filter((f) => f.fundraiserId === fundraiserId).map((f) => f.id)
    );
    return this.all().filter((d) => fsaIds.has(d.fsaId));
  },

  forFSA(fsaId) {
    return this.all().filter((d) => d.fsaId === fsaId);
  },

  /** Aggregate stats for platform manager's dashboard. */
  platformStats() {
    const list = this.all();
    return {
      totalDonations: list.length,
      totalAmount: list.reduce((sum, d) => sum + d.amount, 0),
      averageAmount: list.length ? list.reduce((s, d) => s + d.amount, 0) / list.length : 0,
    };
  },
};
