import { api } from '../utils/api.js';

export const ReportController = {
  async publicStats() {
    try {
      const data = await api.get('/reports/public');
      return {
        totalFSAs: data.total_campaigns || 0,
        activeFSAs: data.active_campaigns || 0,
        totalDonations: data.total_donations || 0,
        totalAmountRaised: data.total_raised || 0,
      };
    } catch {
      return { totalFSAs: 0, activeFSAs: 0, totalDonations: 0, totalAmountRaised: 0 };
    }
  },

  async overview() {
    const data = await api.get('/reports/metrics');
    return {
      totalUsers: data.total_users || 0,
      activeFSAs: data.active_campaigns || 0,
      totalFSAs: data.total_campaigns || 0,
      completedFSAs: data.completed_campaigns || 0,
      totalAmountRaised: data.total_raised || 0,
      totalDonations: data.total_donations || 0,
      averageDonation: data.average_donation || 0,
      totalCategories: data.total_categories || 0,
    };
  },

  async timeSeries(period = 'daily') {
    const n = period === 'daily' ? 14 : 12;
    const data = await api.get(`/reports/series?period=${period}&n=${n}`);
    return data.series || [];
  },

  async byCategory() {
    const { FSAController } = await import('./FSAController.js');
    const { items: allFSAs } = await FSAController.search({ pageSize: 1000 });

    const catMap = {};
    for (const fsa of allFSAs) {
      const cat = fsa.categoryId || 'Uncategorised';
      if (!catMap[cat]) catMap[cat] = { fsaCount: 0, totalRaised: 0, donationCount: 0 };
      catMap[cat].fsaCount += 1;
      catMap[cat].totalRaised += fsa.raisedAmount || 0;
    }

    return Object.entries(catMap).map(([name, stats]) => ({
      category: { id: name, name },
      ...stats,
    }));
  },
};
