/**
 * FSAForm — reusable create/edit form used by both CreateFSA and the edit dialog.
 */
import { useEffect, useState } from 'react';
import {
  Button, Grid, MenuItem, Stack, TextField, InputAdornment,
} from '@mui/material';
import { CategoryController } from '../../control/CategoryController.js';
import {
  validateForm, required, minLength, positiveNumber, composeRules,
} from '../../utils/validators.js';

const SCHEMA = {
  title: composeRules(required, minLength(5)),
  description: composeRules(required, minLength(20)),
  categoryId: required,
  goalAmount: positiveNumber,
  startDate: required,
  endDate: required,
};

const DEFAULT_VALUES = {
  title: '', description: '', categoryId: '',
  goalAmount: '', location: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  imageUrl: '',
};

export default function FSAForm({ initialValues, onSubmit, onCancel, submitLabel = 'Create' }) {
  const [values, setValues] = useState(() => ({ ...DEFAULT_VALUES, ...initialValues }));
  const [errors, setErrors] = useState({});
  const categories = CategoryController.listActive();

  // Sync external updates (e.g. opening the edit dialog with a different FSA).
  useEffect(() => { if (initialValues) setValues((v) => ({ ...v, ...initialValues })); }, [initialValues]);

  const onChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const { errors: vErr, valid } = validateForm(values, SCHEMA);
    // Cross-field rule: endDate must come after startDate.
    if (valid && new Date(values.endDate) <= new Date(values.startDate)) {
      vErr.endDate = 'End date must be after start date';
    }
    setErrors(vErr);
    if (Object.keys(vErr).length > 0) return;
    onSubmit({ ...values, goalAmount: Number(values.goalAmount) });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField name="title" label="Title" value={values.title} onChange={onChange}
            error={Boolean(errors.title)} helperText={errors.title} fullWidth />
        </Grid>
        <Grid item xs={12}>
          <TextField name="description" label="Description" value={values.description}
            onChange={onChange} error={Boolean(errors.description)} helperText={errors.description}
            multiline rows={4} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField select name="categoryId" label="Category" value={values.categoryId}
            onChange={onChange} error={Boolean(errors.categoryId)} helperText={errors.categoryId} fullWidth>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField name="goalAmount" label="Goal Amount" type="number" value={values.goalAmount}
            onChange={onChange} error={Boolean(errors.goalAmount)} helperText={errors.goalAmount}
            InputProps={{ startAdornment: <InputAdornment position="start">SGD</InputAdornment> }} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField name="startDate" label="Start Date" type="date" value={values.startDate}
            onChange={onChange} error={Boolean(errors.startDate)} helperText={errors.startDate}
            InputLabelProps={{ shrink: true }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="endDate" label="End Date" type="date" value={values.endDate}
            onChange={onChange} error={Boolean(errors.endDate)} helperText={errors.endDate}
            InputLabelProps={{ shrink: true }} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField name="location" label="Location" value={values.location} onChange={onChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="imageUrl" label="Cover Image URL" value={values.imageUrl} onChange={onChange} fullWidth
            placeholder="https://images.unsplash.com/…" />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onCancel && <Button onClick={onCancel}>Cancel</Button>}
            <Button type="submit" variant="contained">{submitLabel}</Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}
