/** Admin overview: system-wide KPIs + recent activity at a glance. */
import { useEffect, useState } from 'react';
import {
  Grid, Typography, Card, CardContent, List, ListItem, ListItemText,
  Button, Stack, Chip, Divider, Box,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CampaignIcon from '@mui/icons-material/Campaign';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../common/PageHeader.jsx';
import StatCard from '../common/StatCard.jsx';
import { UserController } from '../../control/UserController.js';
import { ReportController } from '../../control/ReportController.js';
import { FSAController } from '../../control/FSAController.js';
import { formatCurrency, timeAgo } from '../../utils/formatters.js';
import { ROLE_LABELS } from '../../entity/User.js';

const STATUS_COLOR = {
  ACTIVE: 'success', COMPLETED: 'primary', CANCELLED: 'error', DRAFT: 'default',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, byRole: {} });
  const [overview, setOverview] = useState({
    activeFSAs: 0, totalFSAs: 0, totalAmountRaised: 0, totalDonations: 0, averageDonation: 0,
  });
  const [recentFSAs, setRecentFSAs] = useState([]);

  useEffect(() => {
    UserController.stats().then(setStats).catch(() => {});
    ReportController.overview().then(setOverview).catch(() => {});
    FSAController.search({ pageSize: 20 })
      .then((res) => setRecentFSAs(
        (res.items || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      ))
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="System-wide statistics and account oversight at a glance." />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PeopleIcon />} label="Total Users" value={stats.total}
            subtitle={`${stats.active} active · ${stats.suspended} suspended`} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CampaignIcon />} label="Active FSAs" value={overview.activeFSAs}
            subtitle={`${overview.totalFSAs} total campaigns`} color="info.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PaymentsIcon />} label="Total Raised" value={formatCurrency(overview.totalAmountRaised)}
            subtitle={`${overview.totalDonations} donations`} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<TrendingUpIcon />} label="Avg Donation" value={formatCurrency(overview.averageDonation)}
            subtitle="Across all users" color="secondary.main" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Users by Role</Typography>
                  <Typography variant="body2" color="text.secondary">Distribution of registered accounts</Typography>
                </Box>
                <Button size="small" component={RouterLink} to="/admin/users" endIcon={<ArrowForwardIcon />}>
                  Manage
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <List disablePadding>
                {Object.entries(stats.byRole).map(([role, count], idx, arr) => (
                  <ListItem key={role} divider={idx < arr.length - 1} sx={{ px: 0, py: 1.25 }}>
                    <ListItemText primary={ROLE_LABELS[role] || role} primaryTypographyProps={{ fontWeight: 500 }} />
                    <Chip label={count} size="small"
                      sx={{ bgcolor: 'rgba(15,118,110,0.08)', color: 'primary.dark', fontWeight: 600 }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Recent FSAs</Typography>
                <Typography variant="body2" color="text.secondary">Latest campaigns created on the platform</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <List disablePadding>
                {recentFSAs.map((f, idx) => (
                  <ListItem key={f.id} divider={idx < recentFSAs.length - 1} sx={{ px: 0, py: 1.25, gap: 1 }}>
                    <ListItemText
                      primary={f.title}
                      primaryTypographyProps={{ fontWeight: 500, noWrap: true, sx: { maxWidth: 220 } }}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                          <Chip label={f.status} size="small" color={STATUS_COLOR[f.status]} variant="outlined" />
                          <Typography variant="caption" color="text.secondary">{timeAgo(f.createdAt)}</Typography>
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    <Typography variant="body2" fontWeight={700} color="primary.dark">
                      {formatCurrency(f.raisedAmount)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
