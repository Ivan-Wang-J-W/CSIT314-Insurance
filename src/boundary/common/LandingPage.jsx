/**
 * LandingPage — public-facing homepage for unauthenticated visitors.
 * GoFundMe-inspired: hero search, live platform stats, featured campaigns,
 * category browser, how-it-works steps, and a CTA banner.
 */
import { useMemo, useState } from 'react';
import {
  AppBar, Avatar, Box, Button, Card, CardContent, CardMedia, Chip, Container,
  Grid, InputAdornment, LinearProgress, Stack, TextField, Toolbar, Typography,
} from '@mui/material';
import SearchIcon          from '@mui/icons-material/Search';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import PeopleIcon          from '@mui/icons-material/People';
import TrendingUpIcon      from '@mui/icons-material/TrendingUp';
import FavoriteIcon        from '@mui/icons-material/Favorite';
import LocalHospitalIcon   from '@mui/icons-material/LocalHospital';
import SchoolIcon          from '@mui/icons-material/School';
import ForestIcon          from '@mui/icons-material/Forest';
import GroupsIcon          from '@mui/icons-material/Groups';
import PetsIcon            from '@mui/icons-material/Pets';
import PaletteIcon         from '@mui/icons-material/Palette';
import SportsIcon          from '@mui/icons-material/SportsSoccer';
import ComputerIcon        from '@mui/icons-material/Computer';
import EmergencyIcon       from '@mui/icons-material/LocalFireDepartment';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FSAController }      from '../../control/FSAController.js';
import { CategoryController } from '../../control/CategoryController.js';
import { ReportController }   from '../../control/ReportController.js';
import { formatCurrency }     from '../../utils/formatters.js';
import { FSA_STATUS }         from '../../entity/FSA.js';

const CATEGORY_ICON = {
  Medical: <LocalHospitalIcon fontSize="small" />,
  Education: <SchoolIcon fontSize="small" />,
  Environment: <ForestIcon fontSize="small" />,
  Community: <GroupsIcon fontSize="small" />,
  Animals: <PetsIcon fontSize="small" />,
  Creative: <PaletteIcon fontSize="small" />,
  Sports: <SportsIcon fontSize="small" />,
  Technology: <ComputerIcon fontSize="small" />,
  Emergency: <EmergencyIcon fontSize="small" />,
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Discover Campaigns',
    desc: 'Browse hundreds of verified fundraising activities across categories like Medical, Education, Community, and more.',
  },
  {
    step: '02',
    title: 'Make Your Impact',
    desc: 'Donate any amount securely. Every contribution — big or small — makes a real difference for someone in need.',
  },
  {
    step: '03',
    title: 'Track the Journey',
    desc: 'Follow campaigns you care about. Watch progress climb as a community comes together to support one another.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const overview    = ReportController.overview();
  const categories  = CategoryController.all().filter((c) => c.active);
  const featuredFSAs = useMemo(
    () =>
      FSAController.all()
        .filter((f) => f.status === FSA_STATUS.ACTIVE)
        .sort((a, b) => b.raisedAmount - a.raisedAmount)
        .slice(0, 6),
    [],
  );

  const handleSearch = () =>
    navigate(`/login?next=/donee/browse${search ? `&q=${encodeURIComponent(search)}` : ''}`);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>

      {/* ── Minimal public nav ─────────────────────────────────────── */}
      <AppBar position="sticky" color="inherit" elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Box
            component={RouterLink} to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1,
                  textDecoration: 'none', color: 'inherit', flexGrow: 1 }}
          >
            <VolunteerActivismIcon color="primary" sx={{ fontSize: 26 }} />
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px">
              Hello Goodbye
            </Typography>
          </Box>
          <Button component={RouterLink} to="/login" variant="outlined" size="small">Log in</Button>
          <Button component={RouterLink} to="/register" variant="contained" size="small" disableElevation>
            Get Started
          </Button>
        </Toolbar>
      </AppBar>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Chip
            label="✨  Trusted by 1,200+ donors"
            sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: 13 }}
          />
          <Typography
            variant="h2" fontWeight={800}
            sx={{ mb: 2, lineHeight: 1.15, fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' } }}
          >
            Help someone change<br />their life today
          </Typography>
          <Typography
            variant="h6" fontWeight={400}
            sx={{ mb: 5, opacity: 0.85, maxWidth: 560, mx: 'auto', lineHeight: 1.6 }}
          >
            Discover fundraising campaigns that matter — medical bills, education,
            community projects, and more.
          </Typography>

          {/* Search bar */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mb: 7 }}>
            <TextField
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'white',
                  borderRadius: 2.5,
                  minWidth: { sm: 380 },
                  '& fieldset': { border: 'none' },
                },
              }}
            />
            <Button
              variant="contained" onClick={handleSearch} size="large" disableElevation
              sx={{
                bgcolor: 'white', color: 'primary.dark', fontWeight: 700,
                borderRadius: 2.5, px: 3,
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Find Campaigns
            </Button>
          </Stack>

          {/* Platform stat pills */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 2, sm: 5 }}
            justifyContent="center"
            alignItems="center"
          >
            {[
              { icon: <TrendingUpIcon />,       value: formatCurrency(overview.totalAmountRaised), label: 'Total Raised' },
              { icon: <VolunteerActivismIcon />, value: `${overview.totalFSAs}`,                   label: 'Campaigns' },
              { icon: <PeopleIcon />,            value: `${overview.totalDonations}+`,              label: 'Donations Made' },
            ].map((s) => (
              <Stack key={s.label} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ opacity: 0.75 }}>{s.icon}</Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>{s.value}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>{s.label}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── Featured Campaigns ─────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Featured Campaigns</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Top campaigns making an impact right now
            </Typography>
          </Box>
          <Button component={RouterLink} to="/login" variant="outlined" size="small">Browse all</Button>
        </Stack>

        <Grid container spacing={3}>
          {featuredFSAs.map((fsa) => {
            const progress = Math.min(100, Math.round((fsa.raisedAmount / fsa.goalAmount) * 100));
            return (
              <Grid item xs={12} sm={6} md={4} key={fsa.id}>
                <Card
                  component={RouterLink}
                  to="/login"
                  sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    textDecoration: 'none', color: 'inherit',
                    transition: 'transform 250ms ease, box-shadow 250ms ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
                    },
                  }}
                >
                  {fsa.imageUrl && (
                    <CardMedia
                      component="img" height="185" image={fsa.imageUrl} alt={fsa.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flex: 1, p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.25, lineHeight: 1.35 }}>
                      {fsa.title}
                    </Typography>
                    <LinearProgress
                      variant="determinate" value={progress}
                      sx={{ mb: 1, borderRadius: 99, height: 7 }}
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography variant="body2" fontWeight={700} color="primary.dark">
                        {formatCurrency(fsa.raisedAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress}% of goal
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* ── Browse by Category ─────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'rgba(15,118,110,0.04)', py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" sx={{ mb: 1 }}>
            Browse by Category
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Find campaigns that match your values
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5} justifyContent="center">
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                component={RouterLink}
                to="/login"
                clickable
                icon={CATEGORY_ICON[cat.name] || <FavoriteIcon fontSize="small" />}
                sx={{
                  px: 1.5, py: 2.75, fontSize: 14, fontWeight: 600,
                  bgcolor: 'white',
                  border: '1px solid', borderColor: 'divider',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    bgcolor: 'primary.main', color: 'white',
                    borderColor: 'primary.main',
                    '& .MuiChip-icon': { color: 'white' },
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(15,118,110,0.20)',
                  },
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ── How it Works ───────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" sx={{ mb: 1 }}>
          How it Works
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 7 }}>
          Making a difference has never been simpler
        </Typography>
        <Grid container spacing={5}>
          {HOW_IT_WORKS.map((step) => (
            <Grid item xs={12} md={4} key={step.step}>
              <Box sx={{ textAlign: 'center', px: { md: 2 } }}>
                <Typography
                  variant="h1" fontWeight={900} color="primary.main"
                  sx={{ opacity: 0.10, lineHeight: 1, mb: -2, fontSize: '7rem' }}
                >
                  {step.step}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {step.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── CTA Banner ─────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#0f172a', color: 'white', py: { xs: 8, md: 11 }, textAlign: 'center', px: 2 }}>
        <Container maxWidth="sm">
          <Avatar
            sx={{ width: 72, height: 72, bgcolor: 'rgba(20,184,166,0.15)', mx: 'auto', mb: 3 }}
          >
            <VolunteerActivismIcon sx={{ fontSize: 38, color: '#14b8a6' }} />
          </Avatar>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5 }}>
            Ready to make a difference?
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.6, mb: 4, lineHeight: 1.7 }}>
            Join thousands of donors and fundraisers building a better community —
            one campaign at a time.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink} to="/register"
              variant="contained" size="large" disableElevation
              sx={{
                bgcolor: '#14b8a6', fontWeight: 700, px: 4, borderRadius: 2.5,
                '&:hover': { bgcolor: '#0d9488' },
              }}
            >
              Start Fundraising
            </Button>
            <Button
              component={RouterLink} to="/register"
              variant="outlined" size="large"
              sx={{
                color: 'white', borderColor: 'rgba(255,255,255,0.3)', px: 4, borderRadius: 2.5,
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              Sign Up as Donor
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: '#0b1120', py: 3, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Hello Goodbye · CSIT314 Group Project · All rights reserved
        </Typography>
      </Box>
    </Box>
  );
}
