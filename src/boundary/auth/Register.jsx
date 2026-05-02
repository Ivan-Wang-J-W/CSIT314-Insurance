/** Registration page for new Donee or Fundraiser accounts. */
import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Link, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../entity/User.js';
import { validateForm, required, emailRule, minLength, composeRules } from '../../utils/validators.js';

const SCHEMA = {
  fullName: composeRules(required, minLength(2)),
  username: composeRules(required, minLength(3)),
  email: composeRules(required, emailRule),
  password: composeRules(required, minLength(6)),
  role: required,
};

export default function Register() {
  const [values, setValues] = useState({
    fullName: '', username: '', email: '', password: '', phone: '',
    role: ROLES.DONEE,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const { errors: vErr, valid } = validateForm(values, SCHEMA);
    setErrors(vErr);
    if (!valid) return;

    setSubmitting(true);
    try {
      const user = await register(values);
      navigate(user.role === ROLES.FUNDRAISER ? '/fundraiser' : '/donee', { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      p: 2,
      background: 'linear-gradient(135deg, #2e7d6b 0%, #5aa997 100%)',
    }}>
      <Card sx={{ width: '100%', maxWidth: 520 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <VolunteerActivismIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700}>Create an account</Typography>
          </Stack>

          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

          <form onSubmit={onSubmit} noValidate>
            <Stack spacing={2}>
              <TextField name="fullName" label="Full Name" value={values.fullName} onChange={onChange}
                error={Boolean(errors.fullName)} helperText={errors.fullName} fullWidth />
              <TextField name="username" label="Username" value={values.username} onChange={onChange}
                error={Boolean(errors.username)} helperText={errors.username} fullWidth />
              <TextField name="email" label="Email" type="email" value={values.email} onChange={onChange}
                error={Boolean(errors.email)} helperText={errors.email} fullWidth />
              <TextField name="password" label="Password" type="password" value={values.password} onChange={onChange}
                error={Boolean(errors.password)} helperText={errors.password} fullWidth />
              <TextField name="phone" label="Phone (optional)" value={values.phone} onChange={onChange} fullWidth />
              <TextField name="role" select label="I want to..." value={values.role} onChange={onChange} fullWidth>
                <MenuItem value={ROLES.DONEE}>Donate to fundraisers</MenuItem>
                <MenuItem value={ROLES.FUNDRAISER}>Run fundraising campaigns</MenuItem>
              </TextField>

              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>
            </Stack>
          </form>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
