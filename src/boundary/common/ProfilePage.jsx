/**
 * ProfilePage — any logged-in user can view and edit their own profile.
 * Shows role-specific activity stats below the edit form.
 */
import { useState } from 'react';
import {
  Avatar, Box, Button, Card, CardContent, Chip, Divider,
  Grid, Stack, TextField, Typography,
} from '@mui/material';
import EditIcon           from '@mui/icons-material/Edit';
import SaveIcon           from '@mui/icons-material/Save';
import CancelIcon         from '@mui/icons-material/Cancel';
import PaymentsIcon       from '@mui/icons-material/Payments';
import FavoriteIcon       from '@mui/icons-material/Favorite';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CampaignIcon       from '@mui/icons-material/Campaign';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import PageHeader         from './PageHeader.jsx';
import StatCard           from './StatCard.jsx';
import { useAuth }        from '../../context/AuthContext.jsx';
import { useToast }       from '../../context/ToastContext.jsx';
import { ROLE_LABELS, ROLES } from '../../entity/User.js';
import { UserController }     from '../../control/UserController.js';
import { DonationController } from '../../control/DonationController.js';
import { FavoriteController } from '../../control/FavoriteController.js';
import { FSAController }      from '../../control/FSAController.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

const AVATAR_COLORS = [
  '#0f766e', '#0369a1', '#7c3aed', '#b45309', '#be123c',
  '#15803d', '#c2410c', '#0e7490',
];

function avatarColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName || '', email: user?.email || '' });

  /* ── Role-specific stats ── */
  const doneeStats = user?.role === ROLES.DONEE
    ? (() => {
        const { total: count, items } = DonationController.searchForDonee(user.id, { pageSize: 9999 });
        const totalAmount = items.reduce((s, d) => s + d.amount, 0);
        const favs = FavoriteController.listForDonee(user.id).length;
        return { totalAmount, count, favs };
      })()
    : null;

  const frStats = user?.role === ROLES.FUNDRAISER
    ? (() => {
        const fsas   = FSAController.all().filter((f) => f.fundraiserId === user.id);
        const raised  = fsas.reduce((s, f) => s + f.raisedAmount, 0);
        const views   = fsas.reduce((s, f) => s + f.views, 0);
        const active  = fsas.filter((f) => f.status === 'ACTIVE').length;
        return { raised, views, active, total: fsas.length };
      })()
    : null;

  const handleSave = () => {
    if (!form.fullName.trim()) { toast.error('Full name is required'); return; }
    UserController.update(user.id, {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
    });
    refresh();
    toast.success('Profile updated');
    setEditing(false);
  };

  const initials = (user?.fullName || user?.username || '?').charAt(0).toUpperCase();
  const bgColor  = avatarColor(user?.id || '');

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="View and manage your account details."
        actions={
          editing ? (
            <Stack direction="row" spacing={1}>
              <Button startIcon={<CancelIcon />} onClick={() => setEditing(false)}>Cancel</Button>
              <Button startIcon={<SaveIcon />} variant="contained" disableElevation onClick={handleSave}>
                Save Changes
              </Button>
            </Stack>
          ) : (
            <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )
        }
      />

      <Grid container spacing={3}>

        {/* ── Identity card ─────────────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4.5, pb: 3 }}>
              <Avatar
                sx={{
                  width: 92, height: 92, fontSize: 38, fontWeight: 800,
                  bgcolor: bgColor, mb: 2.5,
                  boxShadow: `0 0 0 4px white, 0 0 0 6px ${bgColor}33`,
                }}
              >
                {initials}
              </Avatar>

              <Typography variant="h6" fontWeight={700}>{user?.fullName || user?.username}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                @{user?.username}
              </Typography>
              <Chip label={ROLE_LABELS[user?.role]} color="primary" size="small" sx={{ fontWeight: 600 }} />

              <Divider sx={{ width: '100%', my: 3 }} />

              <Stack spacing={2} sx={{ width: '100%' }}>
                {[
                  { label: 'Email',        value: user?.email },
                  { label: 'Member Since', value: formatDate(user?.createdAt) },
                  {
                    label: 'Status',
                    value: (
                      <Chip
                        label={user?.status} size="small"
                        color={user?.status === 'ACTIVE' ? 'success' : 'warning'}
                        sx={{ mt: 0.5 }}
                      />
                    ),
                  },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography
                      variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
                    >
                      {label}
                    </Typography>
                    {typeof value === 'string'
                      ? <Typography variant="body2">{value}</Typography>
                      : value}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Edit form + stats ─────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
                {editing ? 'Edit Details' : 'Account Details'}
              </Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name"
                    value={editing ? form.fullName : (user?.fullName || '—')}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    disabled={!editing}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Username"
                    value={user?.username || ''}
                    disabled
                    fullWidth
                    helperText="Username cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    value={editing ? form.email : (user?.email || '—')}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={!editing}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Donee stats ── */}
          {doneeStats && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, pl: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Your Activity
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <StatCard icon={<PaymentsIcon />} label="Total Donated" value={formatCurrency(doneeStats.totalAmount)} color="primary.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard icon={<VolunteerActivismIcon />} label="Donations Made" value={doneeStats.count} color="success.main" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard icon={<FavoriteIcon />} label="Favourites Saved" value={doneeStats.favs} color="error.main" />
                </Grid>
              </Grid>
            </>
          )}

          {/* ── Fundraiser stats ── */}
          {frStats && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, pl: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Your Activity
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StatCard icon={<PaymentsIcon />}   label="Total Raised"  value={formatCurrency(frStats.raised)} color="primary.main" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard icon={<CampaignIcon />}   label="Active FSAs"   value={frStats.active}  color="success.main" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard icon={<VisibilityIcon />} label="Total Views"   value={frStats.views}   color="info.main" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard icon={<CampaignIcon />}   label="Total FSAs"    value={frStats.total}   color="secondary.main" />
                </Grid>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </>
  );
}
