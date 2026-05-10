/** Platform Manager — review and approve/reject/suspend campaigns. */
import { useEffect, useState } from 'react';
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography, Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PageHeader from '../common/PageHeader.jsx';
import { FSAController } from '../../control/FSAController.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency } from '../../utils/formatters.js';

const STATUS_COLOR = {
  PENDING: 'warning', ACTIVE: 'success', COMPLETED: 'primary',
  REJECTED: 'error', CANCELLED: 'default', SUSPENDED: 'error',
};

const ALL_STATUSES = ['', 'PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED', 'SUSPENDED'];

const EMPTY_DIALOG = { open: false, type: null, id: null, title: '' };

export default function CampaignReview() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(EMPTY_DIALOG);
  const [remarks, setRemarks] = useState('');

  const load = async (status) => {
    setLoading(true);
    try {
      const { items } = await FSAController.search({ status: status || undefined, pageSize: 100 });
      setCampaigns(items);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const openDialog = (type, campaign) => {
    setRemarks('');
    setDialog({ open: true, type, id: campaign.id, title: campaign.title });
  };
  const closeDialog = () => setDialog(EMPTY_DIALOG);

  const handleConfirm = async () => {
    try {
      if (dialog.type === 'approve') {
        await FSAController.approve(dialog.id);
        toast.success('Campaign approved successfully');
      } else if (dialog.type === 'reject') {
        await FSAController.reject(dialog.id, remarks);
        toast.success('Campaign rejected');
      } else if (dialog.type === 'suspend') {
        await FSAController.suspend(dialog.id);
        toast.success('Campaign suspended');
      }
      closeDialog();
      load(statusFilter);
    } catch (err) { toast.error(err.message); }
  };

  const dialogConfig = {
    approve: {
      title: 'Approve Campaign',
      body: (title) => `Are you sure you want to approve "${title}"? It will become visible to all donees.`,
      confirmLabel: 'Yes, Approve',
      confirmColor: 'success',
    },
    reject: {
      title: 'Reject Campaign',
      body: (title) => `You are rejecting "${title}". Please provide a reason so the fundraiser can improve their submission.`,
      confirmLabel: 'Yes, Reject',
      confirmColor: 'error',
    },
    suspend: {
      title: 'Suspend Campaign',
      body: (title) => `Are you sure you want to suspend "${title}"? Donees will no longer be able to donate to it.`,
      confirmLabel: 'Yes, Suspend',
      confirmColor: 'warning',
    },
  };

  const cfg = dialogConfig[dialog.type] || {};

  return (
    <>
      <PageHeader
        title="Campaign Review"
        subtitle="Approve, reject, or suspend fundraising campaigns"
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}
        >
          {ALL_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>{s || 'All'}</MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </Typography>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Title</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Goal</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>End Date</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell>
              </TableRow>
            )}
            {!loading && campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No campaigns found.</TableCell>
              </TableRow>
            )}
            {campaigns.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: 'block' }}>
                    {c.description?.slice(0, 80)}…
                  </Typography>
                </TableCell>
                <TableCell>{c.categoryId}</TableCell>
                <TableCell>{formatCurrency(c.goalAmount)}</TableCell>
                <TableCell>
                  <Chip label={c.status} size="small" color={STATUS_COLOR[c.status] || 'default'} />
                </TableCell>
                <TableCell>{c.endDate || '—'}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {c.status === 'PENDING' && (
                      <>
                        <Button size="small" color="success" startIcon={<CheckCircleIcon />}
                          onClick={() => openDialog('approve', c)}>
                          Approve
                        </Button>
                        <Button size="small" color="error" startIcon={<CancelIcon />}
                          onClick={() => openDialog('reject', c)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {c.status === 'ACTIVE' && (
                      <Button size="small" color="warning" startIcon={<PauseCircleIcon />}
                        onClick={() => openDialog('suspend', c)}>
                        Suspend
                      </Button>
                    )}
                    {!['PENDING', 'ACTIVE'].includes(c.status) && (
                      <Typography variant="caption" color="text.disabled">No actions</Typography>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Unified confirmation dialog for approve / reject / suspend */}
      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{cfg.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: dialog.type === 'reject' ? 2 : 0 }}>
            {cfg.body?.(dialog.title)}
          </Typography>
          {dialog.type === 'reject' && (
            <TextField
              autoFocus fullWidth multiline rows={3} label="Reason for rejection"
              value={remarks} onChange={(e) => setRemarks(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} variant="outlined">No, Cancel</Button>
          <Button onClick={handleConfirm} color={cfg.confirmColor} variant="contained">
            {cfg.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
