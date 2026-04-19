/** Admin's user-management page: search, filter, suspend/reactivate, delete. */
import { useMemo, useState } from 'react';
import {
  Box, Button, Card, Chip, IconButton, MenuItem, Pagination, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PageHeader from '../common/PageHeader.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { UserController } from '../../control/UserController.js';
import { ROLES, ROLE_LABELS } from '../../entity/User.js';
import { formatDate } from '../../utils/formatters.js';
import { useToast } from '../../context/ToastContext.jsx';

const PAGE_SIZE = 10;

export default function UserManagement() {
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0); // bump to force reload after mutation
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  const { items, total } = useMemo(
    () => UserController.search({ ...filters, page, pageSize: PAGE_SIZE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, page, version]
  );
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }));
    setPage(1);
  };

  const doConfirm = () => {
    if (!confirm) return;
    const { user, action } = confirm;
    if (action === 'delete') {
      UserController.delete(user.id);
      toast.success(`User @${user.username} deleted`);
    } else {
      UserController.toggleStatus(user.id);
      toast.success(`@${user.username} ${action === 'suspend' ? 'suspended' : 'reactivated'}`);
    }
    setVersion((v) => v + 1);
  };

  return (
    <>
      <PageHeader title="User Management" subtitle={`${total} accounts`} />

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Search" placeholder="Username, email, name…"
            value={filters.q} onChange={handleFilterChange('q')} fullWidth
          />
          <TextField select label="Role" value={filters.role} onChange={handleFilterChange('role')} sx={{ minWidth: 200 }}>
            <MenuItem value="">All roles</MenuItem>
            {Object.values(ROLES).map((r) => (
              <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
            ))}
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
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
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
                      <Chip
                        size="small"
                        label={u.status}
                        color={u.status === 'ACTIVE' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}>
                        <IconButton
                          onClick={() => setConfirm({
                            user: u,
                            action: u.status === 'ACTIVE' ? 'suspend' : 'reactivate',
                          })}
                          size="small"
                        >
                          {u.status === 'ACTIVE' ? <BlockIcon /> : <CheckCircleIcon color="success" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => setConfirm({ user: u, action: 'delete' })}
                          size="small"
                          color="error"
                        >
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
        title={
          confirm?.action === 'delete'     ? 'Delete user?' :
          confirm?.action === 'suspend'    ? 'Suspend user?' :
                                            'Reactivate user?'
        }
        message={
          confirm?.action === 'delete'
            ? `Permanently remove @${confirm?.user?.username}? This action cannot be undone.`
            : confirm?.action === 'suspend'
            ? `@${confirm?.user?.username} will lose access until reactivated. Continue?`
            : `Restore full access for @${confirm?.user?.username}?`
        }
        confirmText={
          confirm?.action === 'delete'  ? 'Yes, delete' :
          confirm?.action === 'suspend' ? 'Yes, suspend' :
                                         'Yes, reactivate'
        }
        variant={
          confirm?.action === 'delete'     ? 'danger' :
          confirm?.action === 'suspend'    ? 'warning' :
                                            'success'
        }
        onConfirm={doConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
