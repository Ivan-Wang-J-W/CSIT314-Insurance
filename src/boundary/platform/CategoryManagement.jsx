/** CRUD interface for FSA categories. */
import { useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../common/PageHeader.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { CategoryController } from '../../control/CategoryController.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/formatters.js';

const EMPTY_FORM = { name: '', description: '', icon: '', active: true };

export default function CategoryManagement() {
  const toast = useToast();
  const [version, setVersion] = useState(0);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', values: EMPTY_FORM });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formError, setFormError] = useState('');

  const categories = CategoryController.list();
  void version;

  const openCreate = () => { setDialog({ open: true, mode: 'create', values: EMPTY_FORM }); setFormError(''); };
  const openEdit = (c) => { setDialog({ open: true, mode: 'edit', values: { ...c } }); setFormError(''); };
  const close = () => setDialog((d) => ({ ...d, open: false }));

  const save = () => {
    const { name } = dialog.values;
    if (!name?.trim()) { setFormError('Name is required'); return; }
    try {
      if (dialog.mode === 'create') {
        CategoryController.create(dialog.values);
        toast.success('Category created');
      } else {
        CategoryController.update(dialog.values.id, dialog.values);
        toast.success('Category updated');
      }
      close();
      setVersion((v) => v + 1);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = (cat) => {
    try {
      CategoryController.delete(cat.id);
      toast.success('Category deleted');
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onField = (k) => (e) =>
    setDialog((d) => ({ ...d, values: { ...d.values, [k]: k === 'active' ? e.target.checked : e.target.value } }));

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Category</Button>}
      />

      <Card>
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><strong>{c.name}</strong></TableCell>
                    <TableCell>{c.description || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={c.active ? 'Active' : 'Inactive'} color={c.active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton onClick={() => openEdit(c)} size="small"><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton onClick={() => setConfirmDelete(c)} size="small" color="error"><DeleteIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={dialog.open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'New Category' : 'Edit Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError && <Box sx={{ color: 'error.main' }}>{formError}</Box>}
            <TextField label="Name" value={dialog.values.name} onChange={onField('name')} fullWidth autoFocus />
            <TextField label="Description" value={dialog.values.description} onChange={onField('description')}
              fullWidth multiline rows={2} />
            <FormControlLabel
              control={<Switch checked={dialog.values.active} onChange={onField('active')} />}
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete category?"
        message={`Delete "${confirmDelete?.name}"? This will fail if any FSAs still use it.`}
        confirmText="Delete"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />
    </>
  );
}
