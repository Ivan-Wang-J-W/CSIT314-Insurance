/** Fundraiser dashboard — their own stats + quick links + recent activity. */
import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Button, Stack, List, ListItem, ListItemText, CircularProgress, Box } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PaymentsIcon from '@mui/icons-material/Payments';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../common/PageHeader.jsx';
import StatCard from '../common/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { DonationController } from '../../control/DonationController.js';
import { formatCurrency, timeAgo } from '../../utils/formatters.js';

const DEFAULT_ANALYTICS = { total: 0, active: 0, completed: 0, totalViews: 0, totalShortlisted: 0, totalRaised: 0, items: [] };

export default function FRDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      FSAController.analyticsFor(user.id),
      DonationController.forFundraiser(user.id),
    ]).then(([a, donations]) => {
      setAnalytics(a);
      setRecentDonations(
        [...donations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.fullName?.split(' ')[0] || user.username}`}
        subtitle="Your fundraising performance at a glance"
        actions={
          <Button variant="contained" startIcon={<AddCircleIcon />} component={RouterLink} to="/fundraiser/create">
            Create FSA
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CampaignIcon />} label="Total FSAs" value={analytics.total}
            subtitle={`${analytics.active} active · ${analytics.completed} completed`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<VisibilityIcon />} label="Total Views" value={analytics.totalViews.toLocaleString()} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<BookmarkIcon />} label="Times Shortlisted" value={analytics.totalShortlisted} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PaymentsIcon />} label="Total Raised" value={formatCurrency(analytics.totalRaised)} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Your Top FSAs</Typography>
                <Button size="small" component={RouterLink} to="/fundraiser/manage">Manage all</Button>
              </Stack>
              <List disablePadding>
                {analytics.items.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No campaigns yet.</Typography>
                )}
                {[...analytics.items]
                  .sort((a, b) => b.raisedAmount - a.raisedAmount)
                  .slice(0, 5)
                  .map((f) => (
                    <ListItem key={f.id} divider>
                      <ListItemText
                        primary={f.title}
                        secondary={`${f.status}`}
                      />
                      <Typography variant="body2" fontWeight={600}>{formatCurrency(f.raisedAmount)}</Typography>
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Donations</Typography>
              <List disablePadding>
                {recentDonations.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No donations yet.</Typography>
                )}
                {recentDonations.map((d) => (
                  <ListItem key={d.id} divider>
                    <ListItemText
                      primary={`${d.anonymous ? 'Anonymous' : 'Donor'} gave ${formatCurrency(d.amount)}`}
                      secondary={timeAgo(d.createdAt)}
                    />
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
