/** Shared MUI theme — one brand to keep every page visually coherent. */
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#0f766e', dark: '#0b5853', light: '#5eb0a8', contrastText: '#ffffff' },
    secondary: { main: '#f59e0b', dark: '#d97706', light: '#fbbf24' },
    background: { default: '#f6f8fb', paper: '#ffffff' },
    success: { main: '#16a34a', light: '#dcfce7' },
    warning: { main: '#d97706', light: '#fef3c7' },
    error: { main: '#dc2626', light: '#fee2e2' },
    info: { main: '#2563eb', light: '#dbeafe' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    divider: '#e5e9f0',
  },
  typography: {
    fontFamily: `'Inter', system-ui, -apple-system, sans-serif`,
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f6f8fb' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e5e9f0',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          transition: 'box-shadow 180ms ease, transform 180ms ease',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        rounded: { borderRadius: 12 },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 16, paddingBlock: 8 },
        containedPrimary: {
          boxShadow: '0 1px 2px rgba(15,118,110,0.2)',
          '&:hover': { boxShadow: '0 4px 12px rgba(15,118,110,0.25)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        sizeSmall: { height: 22 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#ffffff', color: '#0f172a' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#ffffff' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#eef2f7' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: '#f6f8fb', color: '#475569' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#0f172a', fontSize: 12, borderRadius: 6 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 8, backgroundColor: '#eef2f7' },
        bar: { borderRadius: 999 },
      },
    },
  },
});
