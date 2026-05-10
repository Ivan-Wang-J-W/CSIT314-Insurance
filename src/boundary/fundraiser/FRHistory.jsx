/** FR's completed/past FSAs — filterable by category and date range. */
import { useEffect, useState } from 'react';
import { Card, Grid, MenuItem, Pagination, Stack, TextField } from '@mui/material';
import PageHeader from '../common/PageHeader.jsx';
import FSACard from '../common/FSACard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { CategoryController } from '../../control/CategoryController.js';
import { FSA_STATUS } from '../../entity/FSA.js';

const PAGE_SIZE = 9;

export default function FRHistory() {
  const { user } = useAuth();
  const categories = CategoryController.list();
  const [filters, setFilters] = useState({ q: '', categoryId: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0 });

  useEffect(() => {
    if (!user) return;
    FSAController.search({
      ...filters,
      fundraiserId: user.id,
      status: FSA_STATUS.COMPLETED,
      page,
      pageSize: PAGE_SIZE,
    })
      .then(setResult)
      .catch(() => {});
  }, [filters, page, user]);

  const { items, total } = result;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onFilterChange = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  return (
    <>
      <PageHeader title="Completed FSAs" subtitle={`${total} past fundraising activities`} />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField label="Search" value={filters.q} onChange={onFilterChange('q')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField select label="Category" value={filters.categoryId} onChange={onFilterChange('categoryId')} fullWidth>
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField label="From" type="date" value={filters.from} onChange={onFilterChange('from')}
              InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField label="To" type="date" value={filters.to} onChange={onFilterChange('to')}
              InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
        </Grid>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No completed FSAs found" subtitle="Try widening your filters." />
      ) : (
        <>
          <Grid container spacing={2}>
            {items.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.id}>
                <FSACard fsa={f} linkTo={`/fsa/${f.id}`} showAnalytics />
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
