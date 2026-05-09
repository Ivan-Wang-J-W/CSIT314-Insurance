/** Platform Manager — audit trail of approved, rejected and suspended campaigns. */
import { useEffect, useRef, useState } from 'react';
import {
  Chip, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import PageHeader from '../common/PageHeader.jsx';
import { FSAController } from '../../control/FSAController.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

const STATUS_OPTIONS = [
  { label: 'All History',  value: 'ACTIVE,COMPLETED,REJECTED,SUSPENDED' },
  { label: 'Approved',     value: 'ACTIVE,COMPLETED' },
  { label: 'Rejected',     value: 'REJECTED' },
  { label: 'Suspended',    value: 'SUSPENDED' },
];

const STATUS_COLOR = {
  ACTIVE: 'success', COMPLETED: 'primary', REJECTED: 'error', SUSPENDED: 'warning',
};

const STATUS_LABEL = {
  ACTIVE: 'Approved (Active)', COMPLETED: 'Approved (Completed)',
  REJECTED: 'Rejected', SUSPENDED: 'Suspended',
};

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ACTIVE,COMPLETED,REJECTED,SUSPENDED');
  const debounceRef = useRef(null);

  const load = async (searchQ, searchStatus) => {
    setLoading(true);
    try {
      const items = await FSAController.searchHistory({ q: searchQ, status: searchStatus });
      setCampaigns(items);
    } catch { setCampaigns([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(q, status); }, [status]);

  const handleQChange = (e) => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val, status), 400);
  };

  return (
    <>
      <PageHeader
        title="Campaign History"
        subtitle="Audit trail of all management decisions on fundraising activities"
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <TextField
          size="small" label="Search" placeholder="Title or description…"
          value={q} onChange={handleQChange} sx={{ minWidth: 280 }}
        />
        <TextField
          select size="small" label="Status" value={status}
          onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary">
          {campaigns.length} record{campaigns.length !== 1 ? 's' : ''}
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
              <TableCell><strong>Submitted</strong></TableCell>
              <TableCell><strong>Rejection Remarks</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && campaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No records found.
                </TableCell>
              </TableRow>
            )}
            {campaigns.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap
                    sx={{ maxWidth: 280, display: 'block' }}>
                    {c.description?.slice(0, 80)}{c.description?.length > 80 ? '…' : ''}
                  </Typography>
                </TableCell>
                <TableCell>{c.categoryId || '—'}</TableCell>
                <TableCell>{formatCurrency(c.goalAmount)}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABEL[c.status] || c.status}
                    size="small"
                    color={STATUS_COLOR[c.status] || 'default'}
                  />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</TableCell>
                <TableCell>
                  {c.rejectionRemarks ? (
                    <Tooltip title={c.rejectionRemarks} placement="top" arrow>
                      <Typography variant="caption" color="error.main" noWrap
                        sx={{ maxWidth: 200, display: 'block', cursor: 'help' }}>
                        {c.rejectionRemarks}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
