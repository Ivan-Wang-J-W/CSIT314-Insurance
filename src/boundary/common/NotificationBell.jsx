/** Bell icon + dropdown list for in-app notifications. */
import { useEffect, useState } from 'react';
import {
  Badge, Box, Divider, IconButton, List, ListItemButton, ListItemText, Menu,
  Typography, Button,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { NotificationController } from '../../control/NotificationController.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { timeAgo } from '../../utils/formatters.js';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { user } = useAuth();
  const [anchor, setAnchor] = useState(null);
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const refresh = async () => {
    try {
      const notifications = await NotificationController.forUser(user.id);
      setItems(notifications);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [user]);

  if (!user) return null;
  const unread = items.filter((n) => !n.read).length;

  const open = (e) => { setAnchor(e.currentTarget); refresh(); };
  const close = () => setAnchor(null);

  const handleClick = async (n) => {
    try {
      await NotificationController.markRead(n.id);
      await refresh();
    } catch {
      // ignore
    }
    if (n.link) navigate(n.link);
    close();
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationController.markAllRead(user.id);
      await refresh();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={open} size="large">
        <Badge badgeContent={unread} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}
        PaperProps={{ sx: { width: 360, maxHeight: 480 } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
          {unread > 0 && <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>}
        </Box>
        <Divider />
        {items.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">No notifications yet</Typography>
          </Box>
        )}
        <List disablePadding>
          {items.slice(0, 15).map((n) => (
            <ListItemButton key={n.id} onClick={() => handleClick(n)}
              sx={{ bgcolor: n.read ? 'transparent' : 'action.hover', alignItems: 'flex-start' }}>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>{n.title}</Typography>}
                secondary={
                  <>
                    <Typography variant="caption" component="span" color="text.secondary" display="block">{n.message}</Typography>
                    <Typography variant="caption" component="span" color="text.disabled">{timeAgo(n.createdAt)}</Typography>
                  </>
                }
              />
            </ListItemButton>
          ))}
        </List>
      </Menu>
    </>
  );
}
