/** Main search/browse page for donees — filters, sorting, pagination. */
import { useEffect, useState } from 'react';
import { Card, Grid, MenuItem, Pagination, Stack, TextField } from '@mui/material';
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

export default function BrowseFSA() {
  const { user } = useAuth();
  const toast = useToast();
  const categories = CategoryController.list();
  const [filters, setFilters] = useState({ q: '', categoryId: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  useEffect(() => {
    FSAController.search({ ...filters, status: FSA_STATUS.ACTIVE, page, pageSize: PAGE_SIZE })
      .then(setResult)
      .catch(() => {});
  }, [filters, page]);

  useEffect(() => {
    if (!user) return;
    FavoriteController.favoriteFSAs(user.id)
      .then((favs) => setFavoritedIds(new Set(favs.map((f) => f.id))))
      .catch(() => {});
  }, [user]);

  const { items, total } = result;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onFilterChange = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

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

  return (
    <>
      <PageHeader title="Browse Fundraising Activities" subtitle={`${total} active campaigns`} />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField label="Search" placeholder="Search by keyword, location…"
              value={filters.q} onChange={onFilterChange('q')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField select label="Category" value={filters.categoryId} onChange={onFilterChange('categoryId')} fullWidth>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Sort by" value={filters.sort} onChange={onFilterChange('sort')} fullWidth>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="ending">Ending Soon</MenuItem>
              <MenuItem value="mostFunded">Most Funded</MenuItem>
              <MenuItem value="mostViewed">Most Viewed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No campaigns found" subtitle="Try different filters or keywords." />
      ) : (
        <>
          <Grid container spacing={2}>
            {items.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.id}>
                <FSACard
                  fsa={f}
                  linkTo={`/fsa/${f.id}`}
                  showFavoriteButton
                  favorited={favoritedIds.has(f.id)}
                  onToggleFavorite={toggleFavorite}
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
