/** Admin's user-management page: search, filter, suspend/reactivate, delete, create. */
import { useEffect, useState } from 'react';
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, Pagination, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PageHeader from '../common/PageHeader.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { UserController } from '../../control/UserController.js';
import { ROLES, ROLE_LABELS } from '../../entity/User.js';
import { formatDate } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';

const EMPTY_FORM = { fullName: '', email: '', username: '', password: '', role: '' };
const ALL_ROLES = Object.values(ROLES);

const PAGE_SIZE = 10;

export default function UserManagement() {
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState(EMPTY_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    UserController.search({ ...filters, page, pageSize: PAGE_SIZE })
      .then(setResult)
      .catch(() => {});
  }, [filters, page, version]);

  const { items, total } = result;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = (field) => (e) => { setFilters((f) => ({ ...f, [field]: e.target.value })); setPage(1); };

  const onCreateChange = (e) => setCreateValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    const errs = {};
    if (!createValues.fullName.trim()) errs.fullName = 'Required';
    if (!createValues.email.trim()) errs.email = 'Required';
    if (!createValues.username.trim()) errs.username = 'Required';
    if (!createValues.password) errs.password = 'Required';
    if (createValues.password.length > 0 && createValues.password.length < 6) errs.password = 'Min 6 characters';
    if (!createValues.role) errs.role = 'Required';
    setCreateErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCreating(true);
    try {
      await UserController.create(createValues);
      toast.success(`Account for @${createValues.username} created`);
      setCreateOpen(false);
      setCreateValues(EMPTY_FORM);
      setCreateErrors({});
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const doConfirm = async () => {
    if (!confirm) return;
    const { user, action } = confirm;
    try {
      if (action === 'delete') {
        await UserController.delete(user.id);
        toast.success(`User @${user.username} deleted`);
      } else {
        await UserController.toggleStatus(user.id);
        toast.success(`@${user.username} ${action === 'suspend' ? 'suspended' : 'reactivated'}`);
      }
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
        <PageHeader title="User Management" subtitle={`${total} accounts`} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreateValues(EMPTY_FORM); setCreateErrors({}); setCreateOpen(true); }} sx={{ mt: 1 }}>
          Create User
        </Button>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Search" placeholder="Username, email, name…"
            value={filters.q} onChange={handleFilterChange('q')} fullWidth />
          <TextField select label="Role" value={filters.role} onChange={handleFilterChange('role')} sx={{ minWidth: 200 }}>
            <MenuItem value="">All roles</MenuItem>
            {Object.values(ROLES).map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={filters.status} onChange={handleFilterChange('status')} sx={{ minWidth: 160 }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </TextField>
        </Stack>
      </Card>

      <Card>
        {items.length === 0 ? (
          <EmptyState title="No users found" subtitle="Try different filters." />
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell>
                  <TableCell>Status</TableCell><TableCell>Joined</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{u.fullName || u.username}</Typography>
                      <Typography variant="caption" color="text.secondary">@{u.username}</Typography>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{ROLE_LABELS[u.role]}</TableCell>
                    <TableCell>
                      <Chip size="small" label={u.status} color={u.status === 'ACTIVE' ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}>
                        <IconButton onClick={() => setConfirm({ user: u, action: u.status === 'ACTIVE' ? 'suspend' : 'reactivate' })} size="small">
                          {u.status === 'ACTIVE' ? <BlockIcon /> : <CheckCircleIcon color="success" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => setConfirm({ user: u, action: 'delete' })} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
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

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === 'delete' ? 'Delete user?' : confirm?.action === 'suspend' ? 'Suspend user?' : 'Reactivate user?'}
        message={
          confirm?.action === 'delete'
            ? `Permanently remove @${confirm?.user?.username}? This action cannot be undone.`
            : confirm?.action === 'suspend'
            ? `@${confirm?.user?.username} will lose access until reactivated. Continue?`
            : `Restore full access for @${confirm?.user?.username}?`
        }
        confirmText={confirm?.action === 'delete' ? 'Yes, delete' : confirm?.action === 'suspend' ? 'Yes, suspend' : 'Yes, reactivate'}
        variant={confirm?.action === 'delete' ? 'danger' : confirm?.action === 'suspend' ? 'warning' : 'success'}
        onConfirm={doConfirm}
        onClose={() => setConfirm(null)}
      />

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User Account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="fullName" label="Full Name" value={createValues.fullName}
              onChange={onCreateChange} error={Boolean(createErrors.fullName)}
              helperText={createErrors.fullName} fullWidth autoFocus
            />
            <TextField
              name="email" label="Email" type="email" value={createValues.email}
              onChange={onCreateChange} error={Boolean(createErrors.email)}
              helperText={createErrors.email} fullWidth
            />
            <TextField
              name="username" label="Username" value={createValues.username}
              onChange={onCreateChange} error={Boolean(createErrors.username)}
              helperText={createErrors.username} fullWidth
            />
            <TextField
              name="password" label="Password"
              type={showPassword ? 'text' : 'password'}
              value={createValues.password}
              onChange={onCreateChange}
              error={Boolean(createErrors.password)}
              helperText={createErrors.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select name="role" label="Role" value={createValues.role}
              onChange={onCreateChange} error={Boolean(createErrors.role)}
              helperText={createErrors.role} fullWidth
            >
              {ALL_ROLES.map((r) => (
                <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? 'Creating…' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
