/** Platform Manager dashboard — high-level KPIs + category breakdown. */
import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, LinearProgress, Stack, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CampaignIcon from '@mui/icons-material/Campaign';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentsIcon from '@mui/icons-material/Payments';
import PageHeader from '../common/PageHeader.jsx';
import StatCard from '../common/StatCard.jsx';
import { ReportController } from '../../control/ReportController.js';
import { formatCurrency } from '../../utils/formatters.js';

export default function PlatformDashboard() {
  const [overview, setOverview] = useState({
    totalUsers: 0, activeFSAs: 0, totalFSAs: 0, completedFSAs: 0,
    totalAmountRaised: 0, totalDonations: 0, totalCategories: 0,
  });
  const [byCategory, setByCategory] = useState([]);

  useEffect(() => {
    ReportController.overview().then(setOverview).catch(() => {});
    ReportController.byCategory().then(setByCategory).catch(() => {});
  }, []);

  const maxRaised = Math.max(1, ...byCategory.map((b) => b.totalRaised));

  return (
    <>
      <PageHeader title="Platform Dashboard" subtitle="Platform-wide performance and health" />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PeopleIcon />} label="Total Users" value={overview.totalUsers} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CampaignIcon />} label="Active FSAs" value={overview.activeFSAs}
            subtitle={`${overview.totalFSAs} total · ${overview.completedFSAs} completed`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PaymentsIcon />} label="Total Raised" value={formatCurrency(overview.totalAmountRaised)}
            subtitle={`${overview.totalDonations} donations`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CategoryIcon />} label="Categories" value={overview.totalCategories} />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Donations by Category</Typography>
          {byCategory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No category data yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {byCategory.map(({ category, fsaCount, donationCount, totalRaised }) => (
                <Box key={category.id || category.name}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{category.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(totalRaised)} · {fsaCount} FSAs · {donationCount} donations
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={(totalRaised / maxRaised) * 100}
                    sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </>
  );
}
