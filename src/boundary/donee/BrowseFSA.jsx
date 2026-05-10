/** Main search/browse page for donees — filters by keyword, category, urgency tier. */
import { useEffect, useMemo, useState } from 'react';
import { Card, Chip, Grid, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';
import PageHeader from '../common/PageHeader.jsx';
import FSACard from '../common/FSACard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { FavoriteController } from '../../control/FavoriteController.js';
import { CategoryController } from '../../control/CategoryController.js';
import { FSA_STATUS } from '../../entity/FSA.js';

const PAGE_SIZE = 9;

const URGENCY_OPTIONS = [
  { value: 'all',          label: 'All Campaigns' },
  { value: 'critical',     label: 'Critical' },
  { value: 'nearly_funded', label: 'Nearly Funded' },
  { value: 'ongoing',      label: 'Ongoing' },
];

const URGENCY_COLORS = {
  critical:      { chip: 'error',   label: 'Critical' },
  nearly_funded: { chip: 'warning', label: 'Nearly Funded' },
  ongoing:       { chip: 'default', label: 'Ongoing' },
};

function getUrgencyBucket(fsa) {
  if (fsa.urgencyTier === 'CRITICAL') return 'critical';
  const pct = fsa.goalAmount > 0 ? fsa.raisedAmount / fsa.goalAmount : 0;
  if (pct >= 0.9) return 'nearly_funded';
  return 'ongoing';
}

export default function BrowseFSA() {
  const { user } = useAuth();
  const toast = useToast();
  const categories = CategoryController.list();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [urgency, setUrgency] = useState('all');
  const [page, setPage] = useState(1);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    FSAController.search({ q, categoryId, status: FSA_STATUS.ACTIVE, pageSize: 500 })
      .then(({ items }) => setAllItems(items))
      .catch(() => setAllItems([]))
      .finally(() => setLoading(false));
    setPage(1);
  }, [q, categoryId]);

  useEffect(() => {
    if (!user) return;
    FavoriteController.favoriteFSAs(user.id)
      .then((favs) => setFavoritedIds(new Set(favs.map((f) => f.id))))
      .catch(() => {});
  }, [user]);

  const filtered = useMemo(() => {
    if (urgency === 'all') return allItems;
    return allItems.filter((f) => getUrgencyBucket(f) === urgency);
  }, [allItems, urgency]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onUrgencyChange = (val) => { setUrgency(val); setPage(1); };

  const toggleFavorite = async (fsa) => {
    try {
      const now = await FavoriteController.toggle(user.id, fsa.id);
      toast.success(now ? 'Saved to favourites' : 'Removed from favourites');
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (now) next.add(fsa.id); else next.delete(fsa.id);
        return next;
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const counts = useMemo(() => ({
    critical:      allItems.filter((f) => getUrgencyBucket(f) === 'critical').length,
    nearly_funded: allItems.filter((f) => getUrgencyBucket(f) === 'nearly_funded').length,
    ongoing:       allItems.filter((f) => getUrgencyBucket(f) === 'ongoing').length,
  }), [allItems]);

  return (
    <>
      <PageHeader title="Browse Fundraising Activities" subtitle={`${filtered.length} active campaigns`} />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              label="Search" placeholder="Search by keyword, location…"
              value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select label="Category" value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }} fullWidth>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Urgency" value={urgency}
              onChange={(e) => onUrgencyChange(e.target.value)} fullWidth>
              {URGENCY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <span>{o.label}</span>
                    {o.value !== 'all' && (
                      <Chip
                        label={counts[o.value]}
                        size="small"
                        color={URGENCY_COLORS[o.value].chip}
                        sx={{ ml: 1, height: 20, fontSize: 11 }}
                      />
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {loading ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>Loading…</Typography>
      ) : pageItems.length === 0 ? (
        <EmptyState title="No campaigns found" subtitle="Try different filters or keywords." />
      ) : (
        <>
          <Grid container spacing={2}>
            {pageItems.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.id}>
                <FSACard
                  fsa={f}
                  linkTo={`/fsa/${f.id}`}
                  showFavoriteButton
                  favorited={favoritedIds.has(f.id)}
                  onToggleFavorite={toggleFavorite}
                  urgencyBucket={getUrgencyBucket(f)}
                />
              </Grid>
            ))}
          </Grid>
          {pageCount > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
              <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Stack>
          )}
        </>
      )}
    </>
  );
}
