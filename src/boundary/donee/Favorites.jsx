/** Donee's saved FSAs — reuses FSACard with favourite toggle. */
import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import PageHeader from '../common/PageHeader.jsx';
import FSACard from '../common/FSACard.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { FavoriteController } from '../../control/FavoriteController.js';

export default function Favorites() {
  const { user } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) return;
    FavoriteController.favoriteFSAs(user.id)
      .then(setFavorites)
      .catch(() => setFavorites([]));
  }, [user, version]);

  const toggle = async (fsa) => {
    try {
      await FavoriteController.toggle(user.id, fsa.id);
      toast.success('Removed from favourites');
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="My Favourites" subtitle={`${favorites.length} saved campaigns`} />
      {favorites.length === 0 ? (
        <EmptyState title="No favourites yet" subtitle="Tap the heart on any FSA to save it here." />
      ) : (
        <Grid container spacing={2}>
          {favorites.map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f.id}>
              <FSACard
                fsa={f}
                linkTo={`/fsa/${f.id}`}
                showFavoriteButton
                favorited
                onToggleFavorite={toggle}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
