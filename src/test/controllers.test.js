/** Controller-layer tests — cover key flows end-to-end through the data store. */
import { describe, expect, it, beforeEach } from 'vitest';
import { initDataStore, resetDataStore } from '../control/dataStore.js';
import { AuthController } from '../control/AuthController.js';
import { FSAController } from '../control/FSAController.js';
import { DonationController } from '../control/DonationController.js';
import { FavoriteController } from '../control/FavoriteController.js';
import { CategoryController } from '../control/CategoryController.js';
import { ROLES } from '../entity/User.js';

beforeEach(() => { resetDataStore(); initDataStore(); });

describe('AuthController', () => {
  it('logs in a valid user', () => {
    const user = AuthController.login('admin', 'admin123');
    expect(user.role).toBe(ROLES.ADMIN);
  });

  it('rejects invalid credentials', () => {
    expect(() => AuthController.login('admin', 'wrong')).toThrow();
  });

  it('registers a new donee and signs them in', () => {
    const user = AuthController.register({
      username: 'newbie', email: 'new@x.com', password: 'pass123', fullName: 'New User',
    });
    expect(user.role).toBe(ROLES.DONEE);
    expect(AuthController.currentUser().id).toBe(user.id);
  });
});

describe('DonationController', () => {
  it('creates a donation and bumps the FSA raised amount', () => {
    const fsa = FSAController.all().find((f) => f.status === 'ACTIVE');
    const before = fsa.raisedAmount;
    DonationController.create({ fsaId: fsa.id, doneeId: 'u-dn-1', amount: 100 });
    const after = FSAController.getById(fsa.id);
    expect(after.raisedAmount).toBe(before + 100);
  });

  it('rejects non-positive amounts', () => {
    const fsa = FSAController.all().find((f) => f.status === 'ACTIVE');
    expect(() => DonationController.create({ fsaId: fsa.id, doneeId: 'u-dn-1', amount: 0 })).toThrow();
  });
});

describe('FavoriteController', () => {
  it('toggles favourite and updates FSA shortlist count', () => {
    const fsa = FSAController.all().find((f) => f.status === 'ACTIVE');
    const before = fsa.shortlisted;
    FavoriteController.toggle('u-dn-1', fsa.id);
    expect(FSAController.getById(fsa.id).shortlisted).toBe(before + 1);
    FavoriteController.toggle('u-dn-1', fsa.id);
    expect(FSAController.getById(fsa.id).shortlisted).toBe(before);
  });
});

describe('CategoryController', () => {
  it('prevents deleting a category that is still used by an FSA', () => {
    const fsa = FSAController.all()[0];
    expect(() => CategoryController.delete(fsa.categoryId)).toThrow();
  });
});
