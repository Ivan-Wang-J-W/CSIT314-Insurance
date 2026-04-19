/** Shared form validators. Each returns a string error message or '' if valid. */

export const required = (v) => (String(v ?? '').trim() ? '' : 'This field is required');

export const minLength = (n) => (v) =>
  String(v ?? '').trim().length >= n ? '' : `Must be at least ${n} characters`;

export const maxLength = (n) => (v) =>
  String(v ?? '').length <= n ? '' : `Must be at most ${n} characters`;

export const emailRule = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address';

export const positiveNumber = (v) =>
  Number(v) > 0 ? '' : 'Must be a positive number';

export const dateNotPast = (v) =>
  !v || new Date(v) >= new Date(new Date().toDateString())
    ? ''
    : 'Date must not be in the past';

/**
 * Run a value through a list of rules, returning the first failing message.
 * Letting callers compose rules keeps validation declarative at the form level.
 */
export const composeRules = (...rules) => (v) => {
  for (const rule of rules) {
    const msg = rule(v);
    if (msg) return msg;
  }
  return '';
};

/**
 * Validate an object against a { field: rule } schema.
 * Returns { errors, valid } — errors is an object keyed by field.
 */
export function validateForm(values, schema) {
  const errors = {};
  for (const [field, rule] of Object.entries(schema)) {
    const msg = rule(values[field]);
    if (msg) errors[field] = msg;
  }
  return { errors, valid: Object.keys(errors).length === 0 };
}
