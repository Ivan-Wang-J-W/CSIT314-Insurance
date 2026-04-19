/** Donee dashboard — personal giving stats + recent activity. */
import { Grid, Card, CardContent, Typography, List, ListItem, ListItemText, Button, Stack } from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import CampaignIcon from '@mui/icons-material/Campaign';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SearchIcon from '@mui/icons-material/Search';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../common/PageHeader.jsx';
import StatCard from '../common/StatCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { DonationController } from '../../control/DonationController.js';
import { FavoriteController } from '../../control/FavoriteController.js';
import { FSAController } from '../../control/FSAController.js';
import { formatCurrency, timeAgo } from '../../utils/formatters.js';

export default function DoneeDashboard() {
  const { user } = useAuth();
  const donations = DonationController.all().filter((d) => d.doneeId === user.id);
  const totalGiven = donations.reduce((s, d) => s + d.amount, 0);
  const favs = FavoriteController.favoriteFSAs(user.id);
  const supportedFSAIds = new Set(donations.map((d) => d.fsaId));
  const supportedFSAs = FSAController.all().filter((f) => supportedFSAIds.has(f.id));

  return (
    <>
      <PageHeader
        title={`Hi, ${user.fullName?.split(' ')[0] || user.username}`}
        subtitle="Your impact at a glance"
        actions={
          <Button variant="contained" startIcon={<SearchIcon />} component={RouterLink} to="/donee/browse">
            Browse FSAs
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PaymentsIcon />} label="Total Donated" value={formatCurrency(totalGiven)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CampaignIcon />} label="Campaigns Supported" value={supportedFSAs.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<FavoriteIcon />} label="Favourites" value={favs.length} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PaymentsIcon />} label="# Donations" value={donations.length} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Campaigns You Support</Typography>
                <Button size="small" component={RouterLink} to="/donee/history">See history</Button>
              </Stack>
              <List disablePadding>
                {supportedFSAs.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    You haven't donated yet. Browse FSAs to get started.
                  </Typography>
                )}
                {supportedFSAs.slice(0, 5).map((f) => (
                  <ListItem key={f.id} divider component={RouterLink} to={`/fsa/${f.id}`} sx={{ color: 'inherit' }}>
                    <ListItemText
                      primary={f.title}
                      secondary={`${Math.min(100, Math.round((f.raisedAmount / f.goalAmount) * 100))}% funded`}
                    />
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
                {donations
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5)
                  .map((d) => (
                    <ListItem key={d.id} divider>
                      <ListItemText
                        primary={`Gave ${formatCurrency(d.amount)}`}
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
