export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function validateLogin({ email, password }) {
  const errors = {};

  if (!normalizeEmail(email)) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function validateRegistration({ displayName, email, password, confirm }) {
  const errors = validateLogin({ email, password });
  const name = String(displayName ?? '').trim();

  if (!name) {
    errors.displayName = 'Display name is required.';
  } else if (name.length > 80) {
    errors.displayName = 'Display name must be 80 characters or fewer.';
  }

  if (password && password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!confirm) {
    errors.confirm = 'Confirm your password.';
  } else if (password !== confirm) {
    errors.confirm = 'Passwords do not match.';
  }

  return errors;
}

export function parsePositiveIntegerInput(value, max = 1000) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) return null;

  const number = Number(text);
  if (!Number.isInteger(number) || number <= 0 || number > max) return null;
  return number;
}

export function parseNonNegativeNumberInput(value, max = 1000) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return null;

  const number = Number(text);
  if (!Number.isFinite(number) || number < 0 || number > max) return null;
  return number;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
