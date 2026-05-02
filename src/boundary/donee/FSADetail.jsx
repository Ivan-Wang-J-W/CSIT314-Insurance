/**
 * FSADetail — publicly accessible detail page for a single FSA.
 * Donees can donate & favourite; other roles see a read-only view.
 */
import { useEffect, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, CardMedia, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Grid, IconButton, LinearProgress, Stack, TextField, Typography, FormControlLabel, Checkbox,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PaymentsIcon from '@mui/icons-material/Payments';
import { useNavigate, useParams } from 'react-router-dom';
import { FSAController } from '../../control/FSAController.js';
import { DonationController } from '../../control/DonationController.js';
import { FavoriteController } from '../../control/FavoriteController.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate, timeAgo } from '../../utils/formatters.js';
import { ROLES } from '../../entity/User.js';
import { FSA_STATUS } from '../../entity/FSA.js';
import EmptyState from '../common/EmptyState.jsx';

export default function FSADetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [fsa, setFsa] = useState(null);
  const [donations, setDonations] = useState([]);
  const [favorited, setFavorited] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    FSAController.getById(id).then(setFsa).catch(() => setFsa(null));
    DonationController.forFSA(id).then(setDonations).catch(() => setDonations([]));
  }, [id, version]);

  useEffect(() => {
    if (user?.role === ROLES.DONEE) {
      FavoriteController.isFavorited(user.id, id).then(setFavorited).catch(() => {});
    }
  }, [user, id, version]);

  if (!fsa) return <EmptyState title="FSA not found" subtitle="This campaign may have been removed or still loading." />;

  const isDonee = user?.role === ROLES.DONEE;
  const progress = Math.min(100, Math.round((fsa.raisedAmount / fsa.goalAmount) * 100));

  const handleToggleFavorite = async () => {
    if (!isDonee) {
      toast.info('Only Donees can save FSAs to favourites');
      return;
    }
    try {
      const now = await FavoriteController.toggle(user.id, fsa.id);
      toast.success(now ? 'Saved to favourites' : 'Removed from favourites');
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>← Back</Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            {fsa.imageUrl && (
              <CardMedia component="img" image={fsa.imageUrl} alt={fsa.title} sx={{ height: 320, objectFit: 'cover' }} />
            )}
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {fsa.categoryId && <Chip label={fsa.categoryId} size="small" />}
                <Chip label={fsa.status} color="primary" size="small" />
              </Stack>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>{fsa.title}</Typography>
              {fsa.location && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2, color: 'text.secondary' }}>
                  <LocationOnIcon fontSize="small" />
                  <Typography variant="body2">{fsa.location}</Typography>
                </Stack>
              )}
              <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>{fsa.description}</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={3} color="text.secondary" sx={{ flexWrap: 'wrap' }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <VisibilityIcon fontSize="small" />
                  <Typography variant="body2">{fsa.views} views</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <BookmarkIcon fontSize="small" />
                  <Typography variant="body2">{fsa.shortlisted} saved</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PaymentsIcon fontSize="small" />
                  <Typography variant="body2">{donations.length} donations</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>Recent Donations</Typography>
                {donations.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {donations.length} donor{donations.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Stack>
              {donations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Be the first to donate.</Typography>
              ) : (
                <Stack spacing={0}>
                  {donations
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10)
                    .map((d, idx, arr) => {
                      const label = d.anonymous ? 'Anonymous' : 'A generous donor';
                      const initials = d.anonymous ? '?' : label.charAt(0);
                      const hue = Math.abs(d.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0)) % 360;
                      return (
                        <Stack key={d.id} direction="row" spacing={2} alignItems="flex-start"
                          sx={{ py: 1.75, borderBottom: idx < arr.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                          <Avatar sx={{ width: 40, height: 40, fontSize: 15, fontWeight: 700, flexShrink: 0, bgcolor: `hsl(${hue}, 55%, 45%)` }}>
                            {initials}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600}>{label}</Typography>
                            {d.message && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontStyle: 'italic' }}>
                                "{d.message}"
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled">{timeAgo(d.createdAt)}</Typography>
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="primary.dark" sx={{ flexShrink: 0 }}>
                            {formatCurrency(d.amount)}
                          </Typography>
                        </Stack>
                      );
                    })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 96 }}>
            <CardContent>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
              <Typography variant="h4" fontWeight={700}>{formatCurrency(fsa.raisedAmount)}</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                raised of {formatCurrency(fsa.goalAmount)} goal ({progress}%)
              </Typography>
              {fsa.status === FSA_STATUS.ACTIVE ? (
                <Stack spacing={1}>
                  <Button variant="contained" size="large" fullWidth disabled={!isDonee} onClick={() => setDonateOpen(true)}>
                    Donate Now
                  </Button>
                  {!isDonee && user && (
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Sign in as a Donee to donate.
                    </Typography>
                  )}
                  <Button
                    startIcon={favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    onClick={handleToggleFavorite}
                    variant="outlined" fullWidth color={favorited ? 'error' : 'primary'}
                  >
                    {favorited ? 'Saved to Favourites' : 'Save to Favourites'}
                  </Button>
                </Stack>
              ) : (
                <Alert severity="info">This campaign is no longer accepting donations.</Alert>
              )}
              <Divider sx={{ my: 3 }} />
              <Typography variant="overline" color="text.secondary">Organiser</Typography>
              <Typography>{fsa.fundraiserId}</Typography>
              <Typography variant="caption" color="text.secondary">Ends {formatDate(fsa.endDate)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DonateDialog
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        fsa={fsa}
        onSuccess={() => setVersion((v) => v + 1)}
      />
    </>
  );
}

function DonateDialog({ open, onClose, fsa, onSuccess }) {
  const { user } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const n = Number(amount);
    if (!n || n <= 0) { setError('Enter a donation amount greater than zero'); return; }
    setSubmitting(true);
    try {
      await DonationController.create({ fsaId: fsa.id, doneeId: user.id, amount: n, message, anonymous });
      toast.success(`Thanks for donating ${formatCurrency(n)}!`);
      onSuccess?.();
      onClose();
      setAmount(''); setMessage(''); setAnonymous(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Support "{fsa.title}"</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[10, 25, 50, 100, 250].map((v) => (
              <Chip key={v} label={formatCurrency(v)} onClick={() => setAmount(String(v))}
                variant={String(v) === amount ? 'filled' : 'outlined'} color="primary" />
            ))}
          </Stack>
          <TextField label="Amount (SGD)" type="number" value={amount}
            onChange={(e) => setAmount(e.target.value)} fullWidth autoFocus />
          <TextField label="Message (optional)" value={message}
            onChange={(e) => setMessage(e.target.value)} fullWidth multiline rows={2} />
          <FormControlLabel
            control={<Checkbox checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />}
            label="Donate anonymously"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Processing…' : 'Donate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
