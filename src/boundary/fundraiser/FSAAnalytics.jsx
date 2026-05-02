/** Per-FSA analytics for a fundraiser: views, shortlists, and donation breakdown. */
import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Chip, Grid, LinearProgress, MenuItem, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PaymentsIcon from '@mui/icons-material/Payments';
import PageHeader from '../common/PageHeader.jsx';
import StatCard from '../common/StatCard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { DonationController } from '../../control/DonationController.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';

export default function FSAAnalytics() {
  const { user } = useAuth();
  const [myFSAs, setMyFSAs] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    if (!user) return;
    FSAController.analyticsFor(user.id)
      .then((analytics) => {
        const items = analytics.items || [];
        setMyFSAs(items);
        if (items.length > 0) setSelectedId(items[0].id);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!selectedId) return;
    DonationController.forFSA(selectedId).then(setDonations).catch(() => setDonations([]));
  }, [selectedId]);

  const selected = myFSAs.find((f) => f.id === selectedId);
  const categoryName = selected?.categoryId || '';

  if (myFSAs.length === 0) {
    return (
      <>
        <PageHeader title="FSA Analytics" />
        <Card><EmptyState title="No FSAs to analyse" subtitle="Create your first FSA to see analytics here." /></Card>
      </>
    );
  }

  const progress = selected ? Math.min(100, Math.round((selected.raisedAmount / selected.goalAmount) * 100)) : 0;

  return (
    <>
      <PageHeader title="FSA Analytics" subtitle="Deep-dive into how each campaign is performing" />

      <Card sx={{ p: 2, mb: 3 }}>
        <TextField
          select label="Select an FSA" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} fullWidth
        >
          {myFSAs.map((f) => (
            <MenuItem key={f.id} value={f.id}>{f.title}</MenuItem>
          ))}
        </TextField>
      </Card>

      {selected && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h5" fontWeight={700}>{selected.title}</Typography>
                {categoryName && <Chip label={categoryName} size="small" />}
                <Chip label={selected.status} size="small" color="primary" />
              </Stack>
              <Typography color="text.secondary" sx={{ mb: 2 }}>{selected.description}</Typography>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight={600}>{formatCurrency(selected.raisedAmount)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress}% of {formatCurrency(selected.goalAmount)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<VisibilityIcon />} label="Views" value={selected.views.toLocaleString()} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<BookmarkIcon />} label="Shortlisted / Saved" value={selected.shortlisted} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatCard icon={<PaymentsIcon />} label="# Donations" value={donations.length} />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Donation History</Typography>
              {donations.length === 0 ? (
                <EmptyState title="No donations yet" />
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Donor</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Message</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {donations
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((d) => (
                          <TableRow key={d.id}>
                            <TableCell>{formatDateTime(d.createdAt)}</TableCell>
                            <TableCell>{d.anonymous ? 'Anonymous' : d.doneeId}</TableCell>
                            <TableCell>{formatCurrency(d.amount)}</TableCell>
                            <TableCell>{d.message || '—'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
