/** Fundraiser's list of FSAs — inline edit, cancel, and delete. */
import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton, MenuItem,
  Pagination, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../common/PageHeader.jsx';
import FSAForm from './FSAForm.jsx';
import EmptyState from '../common/EmptyState.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { CategoryController } from '../../control/CategoryController.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { FSA_STATUS } from '../../entity/FSA.js';

const PAGE_SIZE = 10;

export default function ManageFSA() {
  const { user } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', categoryId: '', status: '' });
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [editing, setEditing] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [result, setResult] = useState({ items: [], total: 0 });

  const categories = CategoryController.list();

  useEffect(() => {
    if (!user) return;
    FSAController.search({
      ...filters, fundraiserId: user.id, page, pageSize: PAGE_SIZE,
    })
      .then(setResult)
      .catch(() => {});
  }, [filters, page, version, user]);

  const { items, total } = result;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onFilterChange = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  const handleSaveEdit = async (values) => {
    try {
      await FSAController.update(editing.id, values);
      setEditing(null);
      setVersion((v) => v + 1);
      toast.success('FSA updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (fsa) => {
    try {
      await FSAController.update(fsa.id, { status: FSA_STATUS.CANCELLED });
      setVersion((v) => v + 1);
      toast.success('FSA cancelled');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (fsa) => {
    try {
      await FSAController.delete(fsa.id);
      setVersion((v) => v + 1);
      toast.success('FSA deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Manage FSAs" subtitle={`${total} campaigns`} />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Search" placeholder="Title, description, location…"
              value={filters.q} onChange={onFilterChange('q')} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Category" value={filters.categoryId} onChange={onFilterChange('categoryId')} fullWidth>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Status" value={filters.status} onChange={onFilterChange('status')} fullWidth>
              <MenuItem value="">All statuses</MenuItem>
              {Object.values(FSA_STATUS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState title="No FSAs yet" subtitle="Create your first fundraising activity to get started." />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Raised / Goal</TableCell>
                  <TableCell>Ends</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((f) => {
                  const category = categories.find((c) => c.id === f.categoryId || c.name === f.categoryId);
                  return (
                    <TableRow key={f.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{f.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {f.views} views · {f.shortlisted} saved
                        </Typography>
                      </TableCell>
                      <TableCell>{category?.name || f.categoryId || '—'}</TableCell>
                      <TableCell><Chip size="small" label={f.status} /></TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(f.raisedAmount)}</Typography>
                        <Typography variant="caption" color="text.secondary">of {formatCurrency(f.goalAmount)}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(f.endDate)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setEditing(f)}><EditIcon /></IconButton>
                        </Tooltip>
                        {f.status === FSA_STATUS.ACTIVE && (
                          <Tooltip title="Cancel">
                            <IconButton size="small" onClick={() => setConfirmAction({ kind: 'cancel', fsa: f })}>
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setConfirmAction({ kind: 'delete', fsa: f })}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
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

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit FSA</DialogTitle>
        <DialogContent>
          {editing && (
            <FSAForm
              initialValues={{
                ...editing,
                startDate: editing.startDate?.slice(0, 10),
                endDate: editing.endDate?.slice(0, 10),
              }}
              submitLabel="Save Changes"
              onSubmit={handleSaveEdit}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.kind === 'delete' ? 'Delete FSA?' : 'Cancel FSA?'}
        message={
          confirmAction?.kind === 'delete'
            ? `Permanently delete "${confirmAction?.fsa?.title}"? This cannot be undone.`
            : `Cancel "${confirmAction?.fsa?.title}"? Donees will no longer be able to donate.`
        }
        confirmText={confirmAction?.kind === 'delete' ? 'Delete' : 'Cancel FSA'}
        danger={confirmAction?.kind === 'delete'}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.kind === 'delete') handleDelete(confirmAction.fsa);
          else handleCancel(confirmAction.fsa);
        }}
        onClose={() => setConfirmAction(null)}
      />
    </>
  );
}
