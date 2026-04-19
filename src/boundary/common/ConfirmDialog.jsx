/** Reusable confirm dialog — beautiful, icon-led, keeps destructive actions one click away. */
import { forwardRef } from 'react';
import {
  Avatar, Box, Button, Dialog, DialogActions, Typography, Slide,
} from '@mui/material';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutline';
import BlockIcon          from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Transition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props} />);

const VARIANT_STYLE = {
  danger:    { bg: 'rgba(220,38,38,0.10)',   fg: '#dc2626', color: 'error',   Icon: DeleteOutlineIcon },
  warning:   { bg: 'rgba(245,158,11,0.10)',  fg: '#d97706', color: 'warning', Icon: BlockIcon },
  success:   { bg: 'rgba(22,163,74,0.10)',   fg: '#16a34a', color: 'success', Icon: CheckCircleOutlineIcon },
  default:   { bg: 'rgba(15,118,110,0.10)',  fg: '#0f766e', color: 'primary', Icon: WarningAmberIcon },
};

export default function ConfirmDialog({
  open, title = 'Are you sure?', message = '',
  confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onClose,
  variant = 'default',
  icon,
}) {
  const style = VARIANT_STYLE[variant] || VARIANT_STYLE.default;
  const IconComponent = style.Icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
          p: 0,
          overflow: 'hidden',
        },
      }}
    >
      {/* Decorative top strip */}
      <Box sx={{ height: 4, bgcolor: `${style.color}.main` }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 0.5, px: 3 }}>
        <Avatar
          sx={{
            width: 68, height: 68,
            bgcolor: style.bg,
            color: style.fg,
            mb: 2.5,
            '& .MuiSvgIcon-root': { fontSize: 34 },
          }}
        >
          {icon || <IconComponent />}
        </Avatar>

        <Typography variant="h6" fontWeight={700} textAlign="center" sx={{ mb: 0.75 }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ lineHeight: 1.65, maxWidth: 300, mb: 0.5 }}
        >
          {message}
        </Typography>
      </Box>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2.5, gap: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: 2.5, py: 1.25,
            borderColor: 'divider',
            color: 'text.secondary',
            fontWeight: 600,
            '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
          }}
        >
          {cancelText}
        </Button>
        <Button
          fullWidth
          variant="contained"
          color={style.color}
          disableElevation
          onClick={() => { onConfirm?.(); onClose?.(); }}
          sx={{ borderRadius: 2.5, py: 1.25, fontWeight: 700 }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
