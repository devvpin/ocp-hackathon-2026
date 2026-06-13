/**
 * Form validation helpers
 */

export function validateRequired(value, fieldName = 'Field') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateEmail(value) {
  if (!value) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return null;
}

export function validateMinLength(value, min, fieldName = 'Field') {
  if (!value || value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return null;
}

export function validateNumeric(value, fieldName = 'Field') {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  if (isNaN(Number(value))) {
    return `${fieldName} must be a number`;
  }
  return null;
}

export function validatePositive(value, fieldName = 'Field') {
  const numErr = validateNumeric(value, fieldName);
  if (numErr) return numErr;
  if (Number(value) < 0) {
    return `${fieldName} must be positive`;
  }
  return null;
}

/**
 * Run multiple validators on a form data object.
 * validators is { fieldName: [validatorFn, ...] }
 * Returns { fieldName: errorMessage } or empty object if valid.
 */
export function validateForm(data, validators) {
  const errors = {};
  for (const [field, fns] of Object.entries(validators)) {
    for (const fn of fns) {
      const error = fn(data[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
}
