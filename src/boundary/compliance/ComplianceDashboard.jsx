/** Compliance dashboard — review fraud reports, escalate campaigns, check identity status. */
import { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Typography,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PageHeader from '../common/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FSAController } from '../../control/FSAController.js';
import { api } from '../../utils/api.js';
import { formatDate, formatDateTime } from '../../utils/formatters.js';

const STATUS_COLOR = { PENDING: 'warning', REVIEWED: 'success', ESCALATED: 'error', CLOSED: 'default' };
const ID_STATUS_COLOR = { VERIFIED: 'success', PENDING: 'default' };
const FILTER_OPTIONS = ['All', 'PENDING', 'REVIEWED', 'ESCALATED'];

const EMPTY_ID_DIALOG = { open: false, campaignId: null, campaignTitle: '', data: null, loading: false };
const EMPTY_ESC_DIALOG = { open: false, campaignId: null, campaignTitle: '' };

export default function ComplianceDashboard() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [campaignMap, setCampaignMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [idDialog, setIdDialog] = useState(EMPTY_ID_DIALOG);
  const [escDialog, setEscDialog] = useState(EMPTY_ESC_DIALOG);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/compliance/fraud-reports');
      const rpts = data.fraud_reports || [];
      setReports(rpts);

      // Fetch campaign titles
      const uniqueCampaignIds = [...new Set(rpts.map((r) => r.campaign_id))];
      const fsas = await Promise.all(
        uniqueCampaignIds.map((id) => FSAController.getById(id).catch(() => null))
      );
      const cMap = {};
      fsas.forEach((f) => { if (f) cMap[f.id] = f.title; });
      setCampaignMap(cMap);

      // Fetch usernames for reported_by IDs
      const uniqueUserIds = [...new Set(rpts.map((r) => r.reported_by).filter(Boolean))];
      const users = await Promise.all(
        uniqueUserIds.map((id) =>
          api.get(`/admin/users/${id}`).then((d) => d.user).catch(() => null)
        )
      );
      const uMap = {};
      users.forEach((u) => { if (u) uMap[u.id] = u.username || u.full_name || u.id; });
      setUserMap(uMap);
    } catch { setReports([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  const handleReview = async (reportId) => {
    try {
      await api.post(`/compliance/fraud-reports/${reportId}/review`, {});
      toast.success('Report marked as reviewed');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleEscalate = async () => {
    try {
      await api.post(`/compliance/campaigns/${escDialog.campaignId}/escalate`, { notes });
      toast.success('Campaign escalated to senior officer');
      setEscDialog(EMPTY_ESC_DIALOG);
      setNotes('');
      load();
    } catch (err) { toast.error(err.message); }
  };

  const openIdStatus = async (campaignId, campaignTitle) => {
    setIdDialog({ open: true, campaignId, campaignTitle, data: null, loading: true });
    try {
      const data = await api.get(`/compliance/campaigns/${campaignId}/identity-status`);
      setIdDialog((prev) => ({ ...prev, data, loading: false }));
    } catch {
      setIdDialog((prev) => ({ ...prev, data: { status: 'UNKNOWN' }, loading: false }));
    }
  };

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <>
      <PageHeader
        title="Compliance Dashboard"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} pending report${pendingCount !== 1 ? 's' : ''} require attention`
            : 'Review fraud reports and escalate high-risk campaigns'
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select size="small" label="Status" value={filter}
          onChange={(e) => setFilter(e.target.value)} sx={{ minWidth: 160 }}
        >
          {FILTER_OPTIONS.map((o) => (
            <MenuItem key={o} value={o}>{o === 'All' ? 'All Statuses' : o}</MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell><strong>Campaign</strong></TableCell>
              <TableCell><strong>Reported By</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No reports found.</TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const campaignTitle = campaignMap[r.campaign_id] || '—';
              const reporterName = userMap[r.reported_by] || r.reported_by || '—';
              return (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{campaignTitle}</Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {r.campaign_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{reporterName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {r.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(r.created_at)}</TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" color={STATUS_COLOR[r.status] || 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button size="small" color="info" startIcon={<VerifiedUserIcon />}
                        onClick={() => openIdStatus(r.campaign_id, campaignTitle)}>
                        ID Status
                      </Button>
                      {r.status === 'PENDING' && (
                        <Button size="small" color="success" startIcon={<GavelIcon />}
                          onClick={() => handleReview(r.id)}>Review</Button>
                      )}
                      {r.status !== 'ESCALATED' && (
                        <Button size="small" color="error" startIcon={<WarningAmberIcon />}
                          onClick={() => {
                            setNotes('');
                            setEscDialog({ open: true, campaignId: r.campaign_id, campaignTitle });
                          }}>
                          Escalate
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Identity Status Dialog */}
      <Dialog open={idDialog.open} onClose={() => setIdDialog(EMPTY_ID_DIALOG)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedUserIcon color="info" />
            <span>Identity Verification Status</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Campaign: <strong>{idDialog.campaignTitle}</strong>
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {idDialog.loading ? (
            <Typography color="text.secondary">Loading…</Typography>
          ) : idDialog.data ? (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary">Verification Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={idDialog.data.status || 'PENDING'}
                    color={ID_STATUS_COLOR[idDialog.data.status] || 'default'}
                    icon={idDialog.data.status === 'VERIFIED'
                      ? <VerifiedUserIcon sx={{ fontSize: '14px !important' }} />
                      : undefined}
                  />
                </Box>
              </Box>
              {idDialog.data.verified_by && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Verified By</Typography>
                  <Typography variant="body2" fontFamily="monospace">{idDialog.data.verified_by}</Typography>
                </Box>
              )}
              {idDialog.data.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Assessor Notes</Typography>
                  <Typography variant="body2">{idDialog.data.notes}</Typography>
                </Box>
              )}
              {idDialog.data.documents?.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Documents ({idDialog.data.documents.length})
                  </Typography>
                  {idDialog.data.documents.map((d, i) => (
                    <Typography key={i} variant="body2" fontFamily="monospace">{d}</Typography>
                  ))}
                </Box>
              )}
              {idDialog.data.status === 'PENDING' && (
                <Typography variant="body2" color="warning.main">
                  This campaign's identity has not been verified by an assessor yet.
                </Typography>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIdDialog(EMPTY_ID_DIALOG)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Escalate Dialog */}
      <Dialog open={escDialog.open} onClose={() => setEscDialog(EMPTY_ESC_DIALOG)} maxWidth="sm" fullWidth>
        <DialogTitle>Escalate Campaign</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Campaign: <strong>{escDialog.campaignTitle}</strong>
          </Typography>
          <TextField
            autoFocus fullWidth multiline rows={3} label="Reason for escalation"
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEscDialog(EMPTY_ESC_DIALOG)} variant="outlined">Cancel</Button>
          <Button onClick={handleEscalate} color="error" variant="contained">Escalate</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
