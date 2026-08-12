import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

import { auth } from '../firebase.js?v=20260812-firebase-auth';
import { validateAuthFieldErrors } from '../utils/authValidation.js?v=20260812-auth-validation';

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'That email already has an account.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/missing-password': 'Enter a password.',
  'auth/user-not-found': 'No account exists for this email.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/weak-password': 'Use at least 8 characters.',
  'auth/network-request-failed': 'Network error. Try again.',
  'auth/too-many-requests': 'Too many attempts. Try again later.'
};

const AUTH_ERROR_TARGETS = {
  'auth/email-already-in-use': 'email',
  'auth/invalid-email': 'email',
  'auth/user-not-found': 'email',
  'auth/invalid-credential': 'password',
  'auth/missing-password': 'password',
  'auth/wrong-password': 'password',
  'auth/weak-password': 'password',
  'auth/network-request-failed': 'form',
  'auth/too-many-requests': 'form'
};

export function initializeHeaderAuth() {
  const container = document.getElementById('authShell');
  if (!container) return;

  container.innerHTML = `
    <section class="auth-panel auth-panel-header" aria-label="Account">
      <a id="authLoginLink" class="auth-button auth-button-primary auth-login-link" href="./login.html">
        <svg class="auth-button-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          <path d="M10 17l5-5-5-5"></path>
          <path d="M15 12H3"></path>
        </svg>
        <span>Login</span>
      </a>
      <div id="authUser" class="auth-user hidden">
        <span id="authUserEmail" class="auth-user-email"></span>
        <button id="authSignOutBtn" class="auth-button" type="button">Sign out</button>
      </div>
      <p id="authMessage" class="auth-message" aria-live="polite"></p>
    </section>
  `;

  const loginLink = document.getElementById('authLoginLink');
  const signOutButton = document.getElementById('authSignOutBtn');
  const userPanel = document.getElementById('authUser');
  const userEmail = document.getElementById('authUserEmail');
  const message = document.getElementById('authMessage');

  signOutButton.addEventListener('click', () => {
    authenticate(() => signOut(auth), {
      messageElement: message
    });
  });

  onAuthStateChanged(auth, user => {
    const signedIn = Boolean(user);
    loginLink.classList.toggle('hidden', signedIn);
    userPanel.classList.toggle('hidden', !signedIn);
    userEmail.textContent = user?.email || '';
    message.textContent = signedIn ? '' : message.textContent;
  });
}

export function initializeAuthPage() {
  const form = document.getElementById('authForm');
  if (!form) return;

  const emailInput = document.getElementById('authEmail');
  const passwordInput = document.getElementById('authPassword');
  const confirmPasswordInput = document.getElementById('authConfirmPassword');
  const emailError = document.getElementById('authEmailError');
  const passwordError = document.getElementById('authPasswordError');
  const confirmPasswordError = document.getElementById('authConfirmPasswordError');
  const loginTab = document.getElementById('authLoginTab');
  const registerTab = document.getElementById('authRegisterTab');
  const submitButton = document.getElementById('authSubmitBtn');
  const forgotPasswordLink = document.getElementById('authForgotPassword');
  const signOutButton = document.getElementById('authSignOutBtn');
  const signedOutPanel = document.getElementById('authSignedOut');
  const signedInPanel = document.getElementById('authSignedIn');
  const signedInEmail = document.getElementById('authSignedInEmail');
  const message = document.getElementById('authMessage');
  let mode = 'login';
  const valuesByMode = {
    login: { email: '', password: '', confirmPassword: '' },
    register: { email: '', password: '', confirmPassword: '' }
  };

  function setMode(nextMode) {
    saveCurrentValues();
    mode = nextMode;
    const isRegister = mode === 'register';
    loginTab.setAttribute('aria-selected', String(!isRegister));
    registerTab.setAttribute('aria-selected', String(isRegister));
    loginTab.classList.toggle('is-active', !isRegister);
    registerTab.classList.toggle('is-active', isRegister);
    confirmPasswordInput.closest('.auth-field').classList.toggle('hidden', !isRegister);
    confirmPasswordInput.required = isRegister;
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    passwordInput.placeholder = isRegister ? 'Create a strong password' : 'Enter your password';
    submitButton.textContent = isRegister ? 'Register' : 'Login';
    forgotPasswordLink.classList.toggle('hidden', isRegister);
    restoreCurrentValues();
    setFieldErrors({});
    message.textContent = '';
  }

  loginTab.addEventListener('click', () => setMode('login'));
  registerTab.addEventListener('click', () => setMode('register'));
  [emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener('input', () => {
      saveCurrentValues();
      clearFieldError(input);
      message.textContent = '';
    });
  });

  forgotPasswordLink.addEventListener('click', event => {
    event.preventDefault();
    message.textContent = 'Password reset is coming next.';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    saveCurrentValues();
    const validationErrors = validateAuthFieldErrors({ email, password, confirmPassword: confirmPasswordInput.value, mode });

    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
    const action = mode === 'register'
      ? () => createUserWithEmailAndPassword(auth, email, password)
      : () => signInWithEmailAndPassword(auth, email, password);

    try {
      message.textContent = '';
      await action();
      window.location.href = './index.html';
    } catch (error) {
      handleAuthError(error, {
        messageElement: message,
        setFieldErrors
      });
    }
  });

  signOutButton.addEventListener('click', () => {
    authenticate(() => signOut(auth), {
      messageElement: message,
      setFieldErrors
    });
  });

  onAuthStateChanged(auth, user => {
    const signedIn = Boolean(user);
    signedOutPanel.classList.toggle('hidden', signedIn);
    signedInPanel.classList.toggle('hidden', !signedIn);
    signedInEmail.textContent = user?.email || '';
  });

  setMode('login');

  function saveCurrentValues() {
    valuesByMode[mode] = {
      email: emailInput.value,
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value
    };
  }

  function restoreCurrentValues() {
    const currentValues = valuesByMode[mode];
    emailInput.value = currentValues.email;
    passwordInput.value = currentValues.password;
    confirmPasswordInput.value = currentValues.confirmPassword;
  }

  function setFieldErrors(errors) {
    setInputError(emailInput, emailError, errors.email);
    setInputError(passwordInput, passwordError, errors.password);
    setInputError(confirmPasswordInput, confirmPasswordError, errors.confirmPassword);
  }
}

async function authenticate(action, options = {}) {
  const { messageElement, setFieldErrors } = options;
  if (messageElement) messageElement.textContent = '';
  setFieldErrors?.({});

  try {
    await action();
    return true;
  } catch (error) {
    handleAuthError(error, options);
    return false;
  }
}

function handleAuthError(error, options = {}) {
  const { messageElement, setFieldErrors } = options;
  const response = authResponseForError(error);

  setFieldErrors?.({});

  if (response.target === 'form' || !setFieldErrors) {
    if (!messageElement) return;
    messageElement.textContent = response.message;
    return;
  }

  setFieldErrors?.({ [response.target]: response.message });
}

function authResponseForError(error) {
  const code = error?.code || '';
  return {
    target: AUTH_ERROR_TARGETS[code] || 'form',
    message: AUTH_ERRORS[code] || 'Authentication failed.'
  };
}

function clearFieldError(input) {
  const errorElement = document.getElementById(`${input.id}Error`);
  setInputError(input, errorElement, '');
}

function setInputError(input, errorElement, error) {
  const hasError = Boolean(error);
  input.classList.toggle('is-invalid', hasError);
  input.setAttribute('aria-invalid', String(hasError));
  if (errorElement) errorElement.textContent = error || '';
}
