/** Assessor dashboard — verify identity, flag fraud, place/lift withdrawal holds. */
import { useEffect, useMemo, useState } from 'react';
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FlagIcon from '@mui/icons-material/Flag';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PageHeader from '../common/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { api } from '../../utils/api.js';
import { formatCurrency } from '../../utils/formatters.js';

const EMPTY_DIALOG = { open: false, type: null, campaignId: null, title: '' };

const DIALOG_CONFIG = {
  verify: { title: 'Verify Identity',       inputLabel: 'Notes (optional)', confirmLabel: 'Confirm Verification', color: 'success' },
  flag:   { title: 'Flag as Fraudulent',    inputLabel: 'Reason *',         confirmLabel: 'Flag Campaign',        color: 'error'   },
  hold:   { title: 'Place Withdrawal Hold', inputLabel: 'Reason *',         confirmLabel: 'Place Hold',           color: 'warning' },
  lift:   { title: 'Lift Withdrawal Hold',  inputLabel: null,                confirmLabel: 'Lift Hold',            color: 'success' },
};

const CAMPAIGN_STATUS_COLOR = { ACTIVE: 'success', PENDING: 'warning', SUSPENDED: 'error' };
const FILTER_OPTIONS = ['All', 'Unverified', 'Verified', 'On Hold'];

export default function AssessorDashboard() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [identityMap, setIdentityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(EMPTY_DIALOG);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const { items } = await FSAController.search({ pageSize: 200 });
      const relevant = items.filter((c) => !['COMPLETED', 'CANCELLED'].includes(c.status));
      setCampaigns(relevant);

      const statuses = await Promise.all(
        relevant.map((c) =>
          api.get(`/assessor/campaigns/${c.id}/identity-status`)
            .catch(() => ({ campaign_id: c.id, status: 'PENDING' }))
        )
      );
      const map = {};
      statuses.forEach((s) => { map[s.campaign_id] = s; });
      setIdentityMap(map);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return campaigns;
    if (filter === 'Verified') return campaigns.filter((c) => identityMap[c.id]?.status === 'VERIFIED');
    if (filter === 'Unverified') return campaigns.filter((c) => identityMap[c.id]?.status !== 'VERIFIED');
    if (filter === 'On Hold') return campaigns.filter((c) => c.withdrawalHeld);
    return campaigns;
  }, [campaigns, identityMap, filter]);

  const openDialog = (type, campaign) => {
    setNotes('');
    setDialog({ open: true, type, campaignId: campaign.id, title: campaign.title });
  };
  const closeDialog = () => setDialog(EMPTY_DIALOG);

  const handleConfirm = async () => {
    const { type, campaignId } = dialog;
    try {
      if (type === 'verify') {
        await api.post(`/assessor/campaigns/${campaignId}/verify-identity`, { notes });
        toast.success('Identity verified successfully');
      } else if (type === 'flag') {
        if (!notes.trim()) { toast.error('Reason is required'); return; }
        await api.post(`/assessor/campaigns/${campaignId}/flag-fraud`, { reason: notes });
        toast.success('Campaign flagged and suspended');
      } else if (type === 'hold') {
        if (!notes.trim()) { toast.error('Reason is required'); return; }
        await api.post(`/assessor/campaigns/${campaignId}/withdrawal-hold`, { reason: notes });
        toast.success('Withdrawal hold placed');
      } else if (type === 'lift') {
        await api.del(`/assessor/campaigns/${campaignId}/withdrawal-hold`);
        toast.success('Withdrawal hold lifted');
      }
      closeDialog();
      load();
    } catch (err) { toast.error(err.message); }
  };

  const cfg = DIALOG_CONFIG[dialog.type] || {};

  return (
    <>
      <PageHeader
        title="Assessor Dashboard"
        subtitle="Review campaigns — verify identity, flag fraud, and manage withdrawal holds"
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select size="small" label="Filter" value={filter}
          onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 160 }}
        >
          {FILTER_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Campaign</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Goal</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Identity</strong></TableCell>
              <TableCell><strong>Hold</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No campaigns match this filter.</TableCell>
              </TableRow>
            )}
            {filtered.map((c) => {
              const idStatus = identityMap[c.id]?.status || 'PENDING';
              const onHold = c.withdrawalHeld;
              return (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220, display: 'block' }}>
                      {c.description?.slice(0, 70)}…
                    </Typography>
                  </TableCell>
                  <TableCell>{c.categoryId || '—'}</TableCell>
                  <TableCell>{formatCurrency(c.goalAmount)}</TableCell>
                  <TableCell>
                    <Chip label={c.status} size="small" color={CAMPAIGN_STATUS_COLOR[c.status] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={idStatus}
                      size="small"
                      color={idStatus === 'VERIFIED' ? 'success' : 'default'}
                      icon={idStatus === 'VERIFIED' ? <VerifiedUserIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    {onHold
                      ? <Chip label="On Hold" size="small" color="warning" />
                      : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {idStatus !== 'VERIFIED' && (
                        <Button size="small" color="success" startIcon={<VerifiedUserIcon />}
                          onClick={() => openDialog('verify', c)}>Verify</Button>
                      )}
                      <Button size="small" color="error" startIcon={<FlagIcon />}
                        onClick={() => openDialog('flag', c)}>Flag</Button>
                      {!onHold ? (
                        <Button size="small" color="warning" startIcon={<PauseCircleIcon />}
                          onClick={() => openDialog('hold', c)}>Hold</Button>
                      ) : (
                        <Button size="small" color="success" startIcon={<LockOpenIcon />}
                          onClick={() => openDialog('lift', c)}>Lift Hold</Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{cfg.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: cfg.inputLabel ? 2 : 1 }}>
            Campaign: <strong>{dialog.title}</strong>
          </Typography>
          {cfg.inputLabel && (
            <TextField
              autoFocus fullWidth multiline rows={3} label={cfg.inputLabel}
              value={notes} onChange={(e) => setNotes(e.target.value)}
            />
          )}
          {dialog.type === 'lift' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This will allow the fundraiser to withdraw funds again.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirm} color={cfg.color} variant="contained">
            {cfg.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
