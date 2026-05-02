/** Daily / weekly / monthly reports for Platform Managers. */
import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Stack, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '../common/PageHeader.jsx';
import { ReportController } from '../../control/ReportController.js';
import { formatCurrency } from '../../utils/formatters.js';

const PERIODS = [
  { key: 'daily', label: 'Daily (14d)' },
  { key: 'weekly', label: 'Weekly (12w)' },
  { key: 'monthly', label: 'Monthly (12m)' },
];

export default function Reports() {
  const [period, setPeriod] = useState('daily');
  const [series, setSeries] = useState([]);

  useEffect(() => {
    ReportController.timeSeries(period).then(setSeries).catch(() => setSeries([]));
  }, [period]);

  const totals = series.reduce(
    (acc, s) => ({ donations: acc.donations + s.donations, amount: acc.amount + s.amount, newFSAs: acc.newFSAs + s.newFSAs, newUsers: acc.newUsers + s.newUsers }),
    { donations: 0, amount: 0, newFSAs: 0, newUsers: 0 }
  );

  const exportCsv = () => {
    const rows = [
      ['Period', 'Donations', 'Amount', 'New FSAs', 'New Users'],
      ...series.map((s) => [s.label, s.donations, s.amount, s.newFSAs, s.newUsers]),
    ];
    const csv = rows.map((r) => r.map((c) => JSON.stringify(c)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `frwa-${period}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Daily, weekly and monthly aggregates"
        actions={<Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv}>Export CSV</Button>} />

      <Card sx={{ mb: 2 }}>
        <Tabs value={period} onChange={(_, v) => setPeriod(v)} indicatorColor="primary" textColor="primary">
          {PERIODS.map((p) => <Tab key={p.key} value={p.key} label={p.label} />)}
        </Tabs>
      </Card>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Donations', value: totals.donations },
          { label: 'Amount', value: formatCurrency(totals.amount) },
          { label: 'New FSAs', value: totals.newFSAs },
          { label: 'New Users', value: totals.newUsers },
        ].map((t) => (
          <Card key={t.label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">{t.label} (period total)</Typography>
              <Typography variant="h5" fontWeight={700}>{t.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Activity Trend</Typography>
          <MiniBarChart series={series} />
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Donations</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">New FSAs</TableCell>
                <TableCell align="right">New Users</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {series.map((s) => (
                <TableRow key={s.label} hover>
                  <TableCell>{s.label}</TableCell>
                  <TableCell align="right">{s.donations}</TableCell>
                  <TableCell align="right">{formatCurrency(s.amount)}</TableCell>
                  <TableCell align="right">{s.newFSAs}</TableCell>
                  <TableCell align="right">{s.newUsers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </>
  );
}

function MiniBarChart({ series }) {
  const max = Math.max(1, ...series.map((s) => s.amount));
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 160, mt: 2 }}>
      {series.map((s) => {
        const h = (s.amount / max) * 100;
        return (
          <Box key={s.label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, minWidth: 40 }}>
            <Box title={`${s.label}: ${formatCurrency(s.amount)}`}
              sx={{ width: '100%', height: `${Math.max(4, h)}%`, bgcolor: 'primary.main', borderRadius: 1, opacity: 0.85, transition: 'all 0.3s ease' }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary', textAlign: 'center' }}>
              {s.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
