const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthFieldErrors({ username = '', email, password, confirmPassword = '', mode = 'login' }) {
  const errors = {};

  if (!EMAIL_PATTERN.test(String(email || '').trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (String(password || '').length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (mode !== 'register') return errors;

  const normalizedUsername = String(username || '').trim();
  if (normalizedUsername.length < 3 || normalizedUsername.length > 40) {
    errors.username = 'Username must be between 3 and 40 characters.';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateAuthFields(input) {
  const errors = validateAuthFieldErrors(input);
  return errors.username || errors.email || errors.password || errors.confirmPassword || '';
}
