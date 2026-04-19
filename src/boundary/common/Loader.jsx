/** Generic loading spinner — inline by default, fullscreen when the whole app is booting. */
import { Box, CircularProgress } from '@mui/material';

export default function Loader({ fullscreen = false, label = '' }) {
  const content = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
      <CircularProgress size={24} />
      {label && <span>{label}</span>}
    </Box>
  );
  if (!fullscreen) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>{content}</Box>;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {content}
    </Box>
  );
}
