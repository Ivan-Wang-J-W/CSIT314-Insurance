/** Dashboard KPI card — one tile, one big number. */
import { Box, Card, CardContent, Typography } from '@mui/material';

const TINT = {
  'primary.main': { bg: 'rgba(15,118,110,0.10)', fg: '#0f766e' },
  'secondary.main': { bg: 'rgba(245,158,11,0.12)', fg: '#b45309' },
  'success.main': { bg: 'rgba(22,163,74,0.12)', fg: '#15803d' },
  'warning.main': { bg: 'rgba(217,119,6,0.12)', fg: '#b45309' },
  'error.main': { bg: 'rgba(220,38,38,0.10)', fg: '#b91c1c' },
  'info.main': { bg: 'rgba(37,99,235,0.10)', fg: '#1d4ed8' },
};

export default function StatCard({ icon, label, value, color = 'primary.main', subtitle }) {
  const tint = TINT[color] || TINT['primary.main'];
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        {icon && (
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: tint.bg, color: tint.fg, flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.25 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
