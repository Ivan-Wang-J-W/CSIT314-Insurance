/**
 * Layout — app shell for authenticated pages.
 *
 * Pattern (same as CERTIS reference):
 *   ┌──────────────────────────────────────────────┐
 *   │ ☰  🌱 FRWA       Fund Raising Web App   🔔 S │  ← full-width AppBar
 *   ├────────┬─────────────────────────────────────┤
 *   │  Nav   │  Page content (Outlet)              │
 *   │ items  │                                     │
 *   └────────┴─────────────────────────────────────┘
 *
 * Logo lives in the AppBar next to the hamburger.
 * Sidebar contains only nav items — no separate brand header.
 * Hamburger collapses sidebar to icon-rail on desktop / opens overlay on mobile.
 */
import { useMemo, useState } from 'react';
import {
  AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon          from '@mui/icons-material/Menu';
import DashboardIcon     from '@mui/icons-material/Dashboard';
import PeopleIcon        from '@mui/icons-material/People';
import CampaignIcon      from '@mui/icons-material/Campaign';
import AddCircleIcon     from '@mui/icons-material/AddCircle';
import InsightsIcon      from '@mui/icons-material/Insights';
import HistoryIcon       from '@mui/icons-material/History';
import SearchIcon        from '@mui/icons-material/Search';
import FavoriteIcon      from '@mui/icons-material/Favorite';
import CategoryIcon      from '@mui/icons-material/Category';
import AssessmentIcon    from '@mui/icons-material/Assessment';
import LogoutIcon        from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth }        from '../../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../../entity/User.js';
import NotificationBell   from './NotificationBell.jsx';

const DRAWER_WIDTH = 240;
const DRAWER_MINI  = 68;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const DUR  = '220ms';
const W_TRANSITION = `width ${DUR} ${EASE}`;

const NAV_BY_ROLE = {
  [ROLES.ADMIN]: [
    { to: '/admin',       label: 'Dashboard',       icon: <DashboardIcon /> },
    { to: '/admin/users', label: 'User Management', icon: <PeopleIcon /> },
  ],
  [ROLES.FUNDRAISER]: [
    { to: '/fundraiser',           label: 'Dashboard',   icon: <DashboardIcon /> },
    { to: '/fundraiser/create',    label: 'Create FSA',  icon: <AddCircleIcon /> },
    { to: '/fundraiser/manage',    label: 'Manage FSAs', icon: <CampaignIcon /> },
    { to: '/fundraiser/analytics', label: 'Analytics',   icon: <InsightsIcon /> },
    { to: '/fundraiser/history',   label: 'History',     icon: <HistoryIcon /> },
  ],
  [ROLES.DONEE]: [
    { to: '/donee',           label: 'Dashboard',        icon: <DashboardIcon /> },
    { to: '/donee/browse',    label: 'Browse FSAs',      icon: <SearchIcon /> },
    { to: '/donee/favorites', label: 'Favourites',       icon: <FavoriteIcon /> },
    { to: '/donee/history',   label: 'Donation History', icon: <HistoryIcon /> },
  ],
  [ROLES.PLATFORM_MANAGER]: [
    { to: '/platform',            label: 'Dashboard',  icon: <DashboardIcon /> },
    { to: '/platform/categories', label: 'Categories', icon: <CategoryIcon /> },
    { to: '/platform/reports',    label: 'Reports',    icon: <AssessmentIcon /> },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const isMobile  = useMediaQuery('(max-width:900px)');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const navItems    = useMemo(() => NAV_BY_ROLE[user?.role] || [], [user]);
  const drawerWidth = isMobile ? 0 : (collapsed ? DRAWER_MINI : DRAWER_WIDTH);

  const handleToggle = () => {
    if (isMobile) setMobileOpen((v) => !v);
    else          setCollapsed((v) => !v);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /** Nav list — shared by both permanent and temporary drawers. */
  const NavList = ({ mini = false }) => (
    <List sx={{ py: 1.5, px: mini ? 0.75 : 1, overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
      {navItems.map((item) => {
        const active = location.pathname === item.to;

        const btn = (
          <ListItemButton
            component={RouterLink}
            to={item.to}
            onClick={() => isMobile && setMobileOpen(false)}
            selected={active}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              minHeight: 46,
              px: mini ? 0 : 1.5,
              justifyContent: mini ? 'center' : 'flex-start',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '& .MuiListItemIcon-root': { color: 'white' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
              '&:not(.Mui-selected):hover': { bgcolor: 'rgba(15,118,110,0.08)' },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: mini ? 0 : 36,
                color: active ? 'white' : 'text.secondary',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!mini && (
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400, noWrap: true }}
              />
            )}
          </ListItemButton>
        );

        return mini ? (
          <Tooltip key={item.to} title={item.label} placement="right" arrow>
            <span>{btn}</span>
          </Tooltip>
        ) : (
          <Box key={item.to}>{btn}</Box>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Full-width AppBar ───────────────────────────────────── */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: '100%',        // always spans full viewport width
        }}
      >
        {/*
          Left padding = (DRAWER_MINI - IconButton width) / 2 = (68 - 40) / 2 = 14px
          This keeps ☰ horizontally centred above the sidebar icon column.
        */}
        <Toolbar sx={{ gap: 0, px: 0, pl: { xs: 1, md: '26px' } }}>

          {/* Hamburger toggle — centred over the sidebar icon rail */}
          <Tooltip title={isMobile ? 'Menu' : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}>
            <IconButton
              edge="start"
              onClick={handleToggle}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'rgba(15,118,110,0.08)', color: 'primary.main' },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>

          {/* Brand — extra left gap so logo sits clearly away from ☰ */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              textDecoration: 'none', color: 'inherit',
              ml: { xs: 1.5, md: 3 },   /* ← wider gap between ☰ and logo */
              mr: 2,
            }}
          >
            <VolunteerActivismIcon color="primary" sx={{ fontSize: 26 }} />
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px" noWrap>
              Hello, Goodbye ! 
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <NotificationBell />

          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 15, fontWeight: 700 }}>
              {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1, minWidth: 200, borderRadius: 2.5,
                border: '1px solid', borderColor: 'divider',
                boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
              },
            }}
          >
            <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', opacity: '1 !important', py: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>
                {user?.fullName || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ROLE_LABELS[user?.role]}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              component={RouterLink}
              to="/profile"
              onClick={() => setMenuAnchor(null)}
              sx={{ gap: 1.5, py: 1.25 }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1.5, py: 1.25 }}>
              <ListItemIcon sx={{ color: 'error.main', minWidth: 0 }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar (nav items only, no brand header) ───────────── */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: W_TRANSITION }}
      >
        {/* Mobile — full-width temporary overlay */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Toolbar />   {/* spacer so nav clears the AppBar */}
          <Divider />
          <NavList mini={false} />
        </Drawer>

        {/* Desktop — permanent, collapses to icon-rail */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              overflowX: 'hidden',
              transition: W_TRANSITION,
            },
          }}
        >
          <Toolbar />   {/* spacer so nav clears the AppBar */}
          <Divider />
          <NavList mini={collapsed} />
        </Drawer>
      </Box>

      {/* ── Page content ─────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, minWidth: 0,
          p: { xs: 2, md: 4 },
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />   {/* spacer so content clears the AppBar */}
        <Outlet />
      </Box>

    </Box>
  );
}
