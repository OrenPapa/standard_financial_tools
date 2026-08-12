import assert from 'node:assert/strict';
import { validateAuthFieldErrors, validateAuthFields } from '../src/utils/authValidation.js';
import { runTest } from './helpers.js';

runTest('auth validation requires a valid email', () => {
  assert.equal(validateAuthFields({
    email: 'not-an-email',
    password: 'Password1',
    mode: 'login'
  }), 'Enter a valid email address.');
});

runTest('auth validation requires 8 password characters before login', () => {
  assert.equal(validateAuthFields({
    email: 'user@example.com',
    password: 'Pass1',
    mode: 'login'
  }), 'Password must be at least 8 characters.');
});

runTest('auth validation checks register password confirmation', () => {
  assert.equal(validateAuthFields({
    email: 'user@example.com',
    password: 'Password1',
    confirmPassword: 'Password2',
    mode: 'register'
  }), 'Passwords do not match.');
});

runTest('auth validation accepts valid login and register fields', () => {
  assert.equal(validateAuthFields({
    email: 'user@example.com',
    password: 'Password1',
    mode: 'login'
  }), '');

  assert.equal(validateAuthFields({
    email: 'user@example.com',
    password: 'password',
    confirmPassword: 'password',
    mode: 'register'
  }), '');
});

runTest('auth validation returns field-specific errors', () => {
  assert.deepEqual(validateAuthFieldErrors({
    email: 'bad',
    password: 'short',
    confirmPassword: 'different',
    mode: 'register'
  }), {
    email: 'Enter a valid email address.',
    password: 'Password must be at least 8 characters.',
    confirmPassword: 'Passwords do not match.'
  });
});
