/**
 * FSAForm — reusable create/edit form used by both CreateFSA and the edit dialog.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Box, Button, CircularProgress, Grid, MenuItem, Stack, TextField, InputAdornment, Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ClearIcon from '@mui/icons-material/Clear';
import { CategoryController } from '../../control/CategoryController.js';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../utils/api.js';
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
  const [uploading, setUploading] = useState(false);
  const categories = CategoryController.listActive();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload('/uploads/', file);
      setValues((v) => ({ ...v, imageUrl: url }));
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
              <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={uploading ? <CircularProgress size={14} /> : <CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Upload Cover Image'}
              </Button>
              {values.imageUrl && (
                <Button
                  size="small" color="error" startIcon={<ClearIcon />}
                  onClick={() => setValues((v) => ({ ...v, imageUrl: '' }))}
                >
                  Remove
                </Button>
              )}
            </Stack>
            {values.imageUrl ? (
              <Box
                component="img"
                src={values.imageUrl}
                alt="Cover preview"
                sx={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                PNG, JPG, GIF or WEBP · max 5 MB
              </Typography>
            )}
          </Stack>
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
