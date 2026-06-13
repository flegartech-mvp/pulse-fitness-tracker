import {
  hasErrors,
  normalizeEmail,
  parseNonNegativeNumberInput,
  parsePositiveIntegerInput,
  validateLogin,
  validateRegistration,
} from '../src/utils/validation';

describe('validation helpers', () => {
  test('normalizes and validates email inputs', () => {
    expect(normalizeEmail('  Athlete@Example.COM ')).toBe('athlete@example.com');
    expect(hasErrors(validateLogin({ email: 'bad-email', password: 'secret' }))).toBe(true);
    expect(validateLogin({ email: 'athlete@example.com', password: 'secret' })).toEqual({});
  });

  test('validates registration fields with useful field errors', () => {
    expect(validateRegistration({
      displayName: '',
      email: 'athlete@example.com',
      password: 'secret',
      confirm: 'secret',
    })).toMatchObject({ displayName: 'Display name is required.' });

    expect(validateRegistration({
      displayName: 'Tini',
      email: 'athlete@example.com',
      password: 'secret',
      confirm: 'different',
    })).toMatchObject({ confirm: 'Passwords do not match.' });
  });

  test('parses workout number fields within server limits', () => {
    expect(parsePositiveIntegerInput('12')).toBe(12);
    expect(parsePositiveIntegerInput('12.5')).toBeNull();
    expect(parsePositiveIntegerInput('1001')).toBeNull();

    expect(parseNonNegativeNumberInput('0')).toBe(0);
    expect(parseNonNegativeNumberInput('82.5')).toBe(82.5);
    expect(parseNonNegativeNumberInput('-1')).toBeNull();
    expect(parseNonNegativeNumberInput('1001')).toBeNull();
  });
});
