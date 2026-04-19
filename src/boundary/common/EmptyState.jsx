/** "Nothing here yet" placeholder for empty lists. */
import { Box, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({ title = 'No results', subtitle = '', icon }) {
  return (
    <Box
      sx={{
        py: 6,
        textAlign: 'center',
        color: 'text.secondary',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {icon ?? <InboxOutlinedIcon sx={{ fontSize: 48, opacity: 0.5 }} />}
      <Typography variant="h6" color="text.primary">
        {title}
      </Typography>
      {subtitle && <Typography variant="body2">{subtitle}</Typography>}
    </Box>
  );
}
