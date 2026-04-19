/**
 * ReportController
 * Platform Manager aggregations — daily/weekly/monthly reports plus high-level KPIs.
 */
import { FSAController } from './FSAController.js';
import { DonationController } from './DonationController.js';
import { UserController } from './UserController.js';
import { CategoryController } from './CategoryController.js';
import { FSA_STATUS } from '../entity/FSA.js';

/** Anchor a date at midnight so bucketing is stable. */
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/** Generate n bucket labels ending today, stepping by the given period. */
function buildBuckets(period, n) {
  const buckets = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(today);
    let start = new Date(today);
    if (period === 'daily') {
      start.setDate(today.getDate() - i);
      end.setDate(today.getDate() - i);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      start.setDate(today.getDate() - i * 7 - 6);
      end.setDate(today.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      end.setMonth(today.getMonth() - i + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    buckets.push({ start, end, label: formatBucketLabel(period, start) });
  }
  return buckets;
}

function formatBucketLabel(period, d) {
  if (period === 'daily')
    return d.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
  if (period === 'weekly')
    return `Wk of ${d.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })}`;
  return d.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
}

export const ReportController = {
  /** KPI cards on the platform dashboard. */
  overview() {
    const fsas = FSAController.all();
    const userStats = UserController.stats();
    const donationStats = DonationController.platformStats();
    return {
      totalUsers: userStats.total,
      totalFSAs: fsas.length,
      activeFSAs: fsas.filter((f) => f.status === FSA_STATUS.ACTIVE).length,
      completedFSAs: fsas.filter((f) => f.status === FSA_STATUS.COMPLETED).length,
      totalDonations: donationStats.totalDonations,
      totalAmountRaised: donationStats.totalAmount,
      averageDonation: donationStats.averageAmount,
      totalCategories: CategoryController.list().length,
      usersByRole: userStats.byRole,
    };
  },

  /**
   * Series of { label, donations, amount, newFSAs, newUsers } buckets for charts/tables.
   * period: 'daily' (last 14 days) | 'weekly' (last 12 weeks) | 'monthly' (last 12 months).
   */
  timeSeries(period = 'daily') {
    const n = period === 'daily' ? 14 : 12;
    const buckets = buildBuckets(period, n);
    const donations = DonationController.all();
    const fsas = FSAController.all();
    const users = UserController.list();

    return buckets.map(({ start, end, label }) => {
      const inRange = (iso) => {
        const d = new Date(iso);
        return d >= start && d <= end;
      };
      const donationsIn = donations.filter((d) => inRange(d.createdAt));
      return {
        label,
        donations: donationsIn.length,
        amount: donationsIn.reduce((s, d) => s + d.amount, 0),
        newFSAs: fsas.filter((f) => inRange(f.createdAt)).length,
        newUsers: users.filter((u) => inRange(u.createdAt)).length,
      };
    });
  },

  /** FSA count + amount by category — for pie/bar charts. */
  byCategory() {
    const categories = CategoryController.list();
    const fsas = FSAController.all();
    const donations = DonationController.all();
    return categories.map((cat) => {
      const catFSAs = fsas.filter((f) => f.categoryId === cat.id);
      const fsaIds = new Set(catFSAs.map((f) => f.id));
      const catDonations = donations.filter((d) => fsaIds.has(d.fsaId));
      return {
        category: cat,
        fsaCount: catFSAs.length,
        donationCount: catDonations.length,
        totalRaised: catDonations.reduce((s, d) => s + d.amount, 0),
      };
    });
  },
};
