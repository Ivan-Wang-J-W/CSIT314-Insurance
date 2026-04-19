/**
 * FSACard — reusable summary card used across Browse / Favorites / FR history.
 * Optional favourite heart toggles shortlist count via FavoriteController.
 */
import {
  Box, Card, CardActionArea, CardContent, CardMedia, Chip, IconButton,
  LinearProgress, Stack, Tooltip, Typography,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link as RouterLink } from 'react-router-dom';
import { formatCurrency, truncate } from '../../utils/formatters.js';
import { CategoryController } from '../../control/CategoryController.js';
import { FSA_STATUS } from '../../entity/FSA.js';

const STATUS_COLOR = {
  [FSA_STATUS.ACTIVE]: 'success',
  [FSA_STATUS.COMPLETED]: 'primary',
  [FSA_STATUS.CANCELLED]: 'error',
  [FSA_STATUS.DRAFT]: 'default',
};

export default function FSACard({
  fsa, linkTo,
  favorited = false, onToggleFavorite, showFavoriteButton = false,
  showAnalytics = false,
}) {
  const progress = Math.min(100, Math.round((fsa.raisedAmount / fsa.goalAmount) * 100));
  const category = CategoryController.getById(fsa.categoryId);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
          transform: 'translateY(-2px)',
          borderColor: 'transparent',
        },
      }}
    >
      {showFavoriteButton && (
        <Tooltip title={favorited ? 'Remove from favourites' : 'Save to favourites'}>
          <IconButton
            onClick={(e) => { e.preventDefault(); onToggleFavorite?.(fsa); }}
            sx={{
              position: 'absolute', top: 10, right: 10, zIndex: 1,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
              '&:hover': { bgcolor: 'white' },
            }}
            size="small"
          >
            {favorited ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      <CardActionArea
        component={RouterLink}
        to={linkTo || `/fsa/${fsa.id}`}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {fsa.imageUrl && (
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <CardMedia
              component="img"
              height="170"
              image={fsa.imageUrl}
              alt={fsa.title}
              sx={{ objectFit: 'cover', transition: 'transform 300ms ease' }}
            />
          </Box>
        )}
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.25 }}>
          <Stack direction="row" spacing={0.75} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
            {category && (
              <Chip
                size="small"
                label={category.name}
                sx={{ bgcolor: 'rgba(15,118,110,0.08)', color: 'primary.dark', border: 'none' }}
              />
            )}
            <Chip size="small" label={fsa.status} color={STATUS_COLOR[fsa.status]} variant="outlined" />
          </Stack>

          <Typography variant="subtitle1" sx={{ mb: 0.5, lineHeight: 1.3, fontWeight: 600 }}>
            {fsa.title}
          </Typography>

          {fsa.location && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
              <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">{fsa.location}</Typography>
            </Stack>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
            {truncate(fsa.description, 100)}
          </Typography>

          <Box>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="body2" fontWeight={700} color="primary.dark">
                {formatCurrency(fsa.raisedAmount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of {formatCurrency(fsa.goalAmount)} · {progress}%
              </Typography>
            </Stack>

            {showAnalytics && (
              <Stack
                direction="row"
                spacing={2}
                sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', color: 'text.secondary' }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <VisibilityIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">{fsa.views} views</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <BookmarkIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">{fsa.shortlisted} saved</Typography>
                </Stack>
              </Stack>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
