/** Donee donation history with category/date filters and FSA progress tracking. */
import { useMemo, useState } from 'react';
import {
  Box, Card, Chip, Grid, LinearProgress, MenuItem, Pagination, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../common/PageHeader.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { DonationController } from '../../control/DonationController.js';
import { FSAController } from '../../control/FSAController.js';
import { CategoryController } from '../../control/CategoryController.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

const PAGE_SIZE = 10;

export default function DonationHistory() {
  const { user } = useAuth();
  const categories = CategoryController.list();
  const [filters, setFilters] = useState({ categoryId: '', from: '', to: '' });
  const [page, setPage] = useState(1);

  const { items, total } = useMemo(
    () => DonationController.searchForDonee(user.id, { ...filters, page, pageSize: PAGE_SIZE }),
    [filters, page, user.id]
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalGiven = items.reduce((s, d) => s + d.amount, 0);

  const onFilterChange = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  return (
    <>
      <PageHeader
        title="Donation History"
        subtitle={`${total} donations · ${formatCurrency(totalGiven)} given on this page`}
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField select label="Category" value={filters.categoryId} onChange={onFilterChange('categoryId')} fullWidth>
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField label="From" type="date" value={filters.from} onChange={onFilterChange('from')}
              InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField label="To" type="date" value={filters.to} onChange={onFilterChange('to')}
              InputLabelProps={{ shrink: true }} fullWidth />
          </Grid>
        </Grid>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState title="No donations in this range" />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>FSA Progress</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((d) => {
                  const fsa = FSAController.getById(d.fsaId);
                  if (!fsa) return null;
                  const cat = categories.find((c) => c.id === fsa.categoryId);
                  const progress = Math.min(100, Math.round((fsa.raisedAmount / fsa.goalAmount) * 100));
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>{formatDate(d.createdAt)}</TableCell>
                      <TableCell>
                        <Typography component={RouterLink} to={`/fsa/${fsa.id}`} color="primary" fontWeight={600}>
                          {fsa.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{cat?.name || '—'}</TableCell>
                      <TableCell align="right"><Typography fontWeight={600}>{formatCurrency(d.amount)}</Typography></TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                          <Typography variant="caption" color="text.secondary">
                            {progress}% of {formatCurrency(fsa.goalAmount)}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Chip size="small" label={fsa.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {pageCount > 1 && (
          <Stack direction="row" justifyContent="center" sx={{ p: 2 }}>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Stack>
        )}
      </Card>
    </>
  );
}
