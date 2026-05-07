/**
 * Login page. Handles validation, surfaces controller errors, and redirects
 * to the correct role-specific landing page on success.
 */
import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Divider, Link, Stack, TextField, Typography,
} from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../entity/User.js';
import { validateForm, required } from '../../utils/validators.js';

const HOME_BY_ROLE = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.FUNDRAISER]: '/fundraiser',
  [ROLES.DONEE]: '/donee',
  [ROLES.PLATFORM_MANAGER]: '/platform',
  [ROLES.ASSESSOR]: '/assessor',
  [ROLES.COMPLIANCE]: '/compliance',
};

const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'admin123' },
  { label: 'Fundraiser', username: 'fr1', password: 'password' },
  { label: 'Donee', username: 'donee1', password: 'password' },
  { label: 'Platform Manager', username: 'pm', password: 'password' },
  { label: 'Assessor', username: 'assessor', password: 'password' },
  { label: 'Compliance', username: 'compliance', password: 'password' },
];

export default function Login() {
  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const { errors: vErr, valid } = validateForm(values, {
      username: required,
      password: required,
    });
    setErrors(vErr);
    if (!valid) return;

    setSubmitting(true);
    try {
      const user = await login(values.username, values.password);
      const redirectTo = location.state?.from?.pathname || HOME_BY_ROLE[user.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (acct) => {
    setValues({ username: acct.username, password: acct.password });
    setErrors({});
    setSubmitError('');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      p: 2,
      background: 'linear-gradient(135deg, #2e7d6b 0%, #5aa997 100%)',
    }}>
      <Card sx={{ width: '100%', maxWidth: 480 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <VolunteerActivismIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700}>Welcome to FRWA</Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to your account to continue.
          </Typography>

          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

          <form onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField
                name="username"
                label="Username or Email"
                value={values.username}
                onChange={onChange}
                error={Boolean(errors.username)}
                helperText={errors.username}
                autoFocus
                fullWidth
              />
              <TextField
                name="password"
                label="Password"
                type="password"
                value={values.password}
                onChange={onChange}
                error={Boolean(errors.password)}
                helperText={errors.password}
                fullWidth
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>or try a demo account</Divider>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {DEMO_ACCOUNTS.map((a) => (
              <Button key={a.label} size="small" variant="outlined" onClick={() => fillDemo(a)}>
                {a.label}
              </Button>
            ))}
          </Stack>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link component={RouterLink} to="/register">Register here</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
