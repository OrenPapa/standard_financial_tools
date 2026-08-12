const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthFieldErrors({ email, password, confirmPassword = '', mode = 'login' }) {
  const errors = {};

  if (!EMAIL_PATTERN.test(String(email || '').trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (String(password || '').length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (mode !== 'register') return errors;

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateAuthFields(input) {
  const errors = validateAuthFieldErrors(input);
  return errors.email || errors.password || errors.confirmPassword || '';
}
