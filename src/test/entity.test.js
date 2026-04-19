/** Entity-layer sanity tests. */
import { describe, expect, it } from 'vitest';
import { FSA, FSA_STATUS } from '../entity/FSA.js';
import { User, ROLES } from '../entity/User.js';

describe('FSA entity', () => {
  it('calculates progress percent correctly', () => {
    const f = new FSA({ id: 'x', title: 't', description: 'd', categoryId: 'c',
      fundraiserId: 'u', goalAmount: 1000, raisedAmount: 250,
      startDate: '2026-01-01', endDate: '2026-02-01' });
    expect(f.progressPercent()).toBe(25);
  });

  it('caps progress at 100%', () => {
    const f = new FSA({ id: 'x', title: 't', description: 'd', categoryId: 'c',
      fundraiserId: 'u', goalAmount: 100, raisedAmount: 500,
      startDate: '2026-01-01', endDate: '2026-02-01' });
    expect(f.progressPercent()).toBe(100);
  });

  it('marks as completed when raised >= goal', () => {
    const f = new FSA({ id: 'x', title: 't', description: 'd', categoryId: 'c',
      fundraiserId: 'u', goalAmount: 100, raisedAmount: 100,
      status: FSA_STATUS.ACTIVE, startDate: '2026-01-01', endDate: '2026-02-01' });
    expect(f.isCompleted()).toBe(true);
  });
});

describe('User entity', () => {
  it('identifies role correctly', () => {
    const u = new User({ id: '1', username: 'a', email: 'a@b.c', password: 'x', role: ROLES.FUNDRAISER });
    expect(u.isFundraiser()).toBe(true);
    expect(u.isDonee()).toBe(false);
  });

  it('toSafeObject strips password', () => {
    const u = new User({ id: '1', username: 'a', email: 'a@b.c', password: 'secret', role: ROLES.DONEE });
    expect(u.toSafeObject().password).toBeUndefined();
  });
});
