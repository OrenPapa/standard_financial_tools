import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

import { auth } from '../firebase.js?v=20260812-firebase-auth';
import { validateAuthFieldErrors } from '../utils/authValidation.js?v=20260812-profile-menu';

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
    <section class="profile-menu-shell" aria-label="Account">
      <button id="profileMenuTrigger" class="profile-trigger is-loading" type="button" aria-haspopup="dialog" aria-expanded="false" disabled>
        <span id="profileAvatar" class="profile-avatar"><span class="profile-avatar-loader" aria-hidden="true"></span></span>
        <svg class="profile-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </button>
      <div id="profileMenu" class="profile-menu hidden" role="dialog" aria-label="Profile menu">
        <div class="profile-menu-header">
          <span id="profileMenuAvatar" class="profile-avatar profile-avatar-large">G</span>
          <div class="profile-menu-user">
            <span class="profile-menu-label">Account</span>
            <span id="profileMenuEmail" class="profile-menu-email">Guest</span>
          </div>
        </div>
        <div class="profile-menu-section" data-guest-actions>
          <a class="auth-button auth-button-primary profile-menu-action" href="./login.html">Login</a>
          <a class="auth-button profile-menu-action" href="./login.html?mode=register">Register</a>
        </div>
        <div class="profile-menu-section profile-theme-row">
          <span class="profile-menu-label">Theme:</span>
          <div id="themePicker" class="theme-picker profile-theme-picker relative inline-flex rounded-md p-0.5"></div>
        </div>
        <div class="profile-menu-section hidden" data-user-actions>
          <button id="authSignOutBtn" class="auth-button profile-menu-action" type="button">
            <span id="authSignOutLabel">Logout</span>
          </button>
        </div>
        <p id="authMessage" class="auth-message profile-menu-message" aria-live="polite"></p>
      </div>
    </section>
  `;

  const trigger = document.getElementById('profileMenuTrigger');
  const menu = document.getElementById('profileMenu');
  const avatar = document.getElementById('profileAvatar');
  const menuAvatar = document.getElementById('profileMenuAvatar');
  const menuEmail = document.getElementById('profileMenuEmail');
  const guestActions = container.querySelector('[data-guest-actions]');
  const userActions = container.querySelector('[data-user-actions]');
  const signOutButton = document.getElementById('authSignOutBtn');
  const signOutLabel = document.getElementById('authSignOutLabel');
  const message = document.getElementById('authMessage');

  trigger.addEventListener('click', event => {
    event.stopPropagation();
    setProfileMenuOpen(menu.classList.contains('hidden'), trigger, menu);
  });

  signOutButton.addEventListener('click', async () => {
    setSignOutLoading(true, signOutButton, signOutLabel);
    const success = await authenticate(() => signOut(auth), {
      messageElement: message
    });
    setSignOutLoading(false, signOutButton, signOutLabel);
    if (success) setProfileMenuOpen(false, trigger, menu);
  });

  onAuthStateChanged(auth, user => {
    const signedIn = Boolean(user);
    const label = user?.email || 'Guest';
    const avatarText = signedIn ? label.trim().charAt(0).toUpperCase() : 'G';
    trigger.disabled = false;
    trigger.classList.remove('is-loading');
    avatar.textContent = avatarText;
    menuAvatar.textContent = avatarText;
    menuEmail.textContent = label;
    guestActions.classList.toggle('hidden', signedIn);
    userActions.classList.toggle('hidden', !signedIn);
    message.textContent = signedIn ? '' : message.textContent;
  });

  document.addEventListener('click', event => {
    if (container.contains(event.target)) return;
    setProfileMenuOpen(false, trigger, menu);
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
  const signedOutPanel = document.getElementById('authSignedOut');
  const redirectLoader = document.getElementById('authRedirectLoader');
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
      showAuthRedirectLoader(signedOutPanel, redirectLoader);
      window.location.replace('./index.html');
    } catch (error) {
      handleAuthError(error, {
        messageElement: message,
        setFieldErrors
      });
    }
  });

  onAuthStateChanged(auth, user => {
    if (!user) return;
    showAuthRedirectLoader(signedOutPanel, redirectLoader);
    window.location.replace('./index.html');
  });

  setMode(new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login');

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

function setProfileMenuOpen(isOpen, trigger, menu) {
  menu.classList.toggle('hidden', !isOpen);
  trigger.setAttribute('aria-expanded', String(isOpen));
}

function showAuthRedirectLoader(signedOutPanel, redirectLoader) {
  signedOutPanel.classList.add('hidden');
  redirectLoader.classList.remove('hidden');
}

function setSignOutLoading(isLoading, button, label) {
  button.disabled = isLoading;
  button.classList.toggle('is-loading', isLoading);
  label.textContent = isLoading ? 'Logging out...' : 'Logout';
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
