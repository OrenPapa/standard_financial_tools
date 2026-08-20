import { Router } from 'express';
import type { RequestHandler } from 'express';

import { clearAuthCookies, readRefreshCookie, setAuthCookies } from '../auth/cookies.js';
import { getAuthConfig } from '../auth/config.js';
import { signAccessToken } from '../auth/jwt.js';
import { verifyPassword, hashPassword } from '../auth/passwords.js';
import { createSessionTokens } from '../auth/sessions.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  markUserEmailVerified,
  toPublicUser
} from '../auth/repository.js';
import {
  createEmailVerificationToken,
  findEmailVerificationToken,
  markEmailVerificationTokenUsed
} from '../auth/verificationRepository.js';
import {
  createRefreshToken,
  findRefreshTokenById,
  revokeRefreshToken,
  revokeUserRefreshTokens
} from '../auth/sessionRepository.js';
import { sendVerificationEmail } from '../auth/mailer.js';
import { requireAuth } from '../auth/middleware.js';
import { addDays, addHours, isPast } from '../utils/dates.js';
import { sendApiError } from '../utils/http.js';
import { createOpaqueToken, hashToken } from '../utils/tokens.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authRouter = Router();

authRouter.post('/register', (async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (username.length < 3 || username.length > 40) {
    sendApiError(res, 400, 'Username must be between 3 and 40 characters.', 'invalid_username');
    return;
  }

  if (!EMAIL_PATTERN.test(email)) {
    sendApiError(res, 400, 'Enter a valid email address.', 'invalid_email');
    return;
  }

  if (password.length < 8) {
    sendApiError(res, 400, 'Password must be at least 8 characters.', 'weak_password');
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    sendApiError(res, 409, 'That email already has an account.', 'email_exists');
    return;
  }

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    sendApiError(res, 409, 'That username is already taken.', 'username_exists');
    return;
  }

  const user = await createUser({
    username,
    email,
    passwordHash: await hashPassword(password)
  });
  const verificationToken = createOpaqueToken();

  await createEmailVerificationToken({
    userId: user.id,
    tokenHash: hashToken(verificationToken),
    expiresAt: addHours(new Date(), getAuthConfig().emailTokenTtlHours)
  });
  await sendVerificationEmail({ email: user.email, token: verificationToken });

  res.status(201).json({
    user: toPublicUser(user),
    message: 'Account created. Check your email to verify your account.'
  });
}) satisfies RequestHandler);

authRouter.get('/verify-email', (async (req, res) => {
  const token = String(req.query.token || '');
  const tokenRecord = await findEmailVerificationToken(hashToken(token));

  if (!token || !tokenRecord || tokenRecord.used_at || isPast(new Date(tokenRecord.expires_at))) {
    res.redirect(`${getAuthConfig().appOrigin}/login.html?verified=invalid`);
    return;
  }

  await markEmailVerificationTokenUsed(tokenRecord.id);
  const user = await markUserEmailVerified(tokenRecord.user_id);
  const publicUser = toPublicUser(user);
  const session = await createSessionTokens(publicUser);

  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.redirect(`${getAuthConfig().appOrigin}/index.html`);
}) satisfies RequestHandler);

authRouter.post('/login', (async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = await findUserByEmail(email);

  if (!user?.password_hash || !(await verifyPassword(password, user.password_hash))) {
    sendApiError(res, 401, 'Email or password is incorrect.', 'invalid_credentials');
    return;
  }

  if (!user.email_verified_at) {
    sendApiError(res, 403, 'Please verify your email before logging in.', 'email_unverified');
    return;
  }

  const publicUser = toPublicUser(user);
  const session = await createSessionTokens(publicUser);

  setAuthCookies(res, session.accessToken, session.refreshToken);
  res.json({ user: publicUser });
}) satisfies RequestHandler);

authRouter.post('/logout', (async (req, res) => {
  const refreshCookie = readRefreshCookie(req.cookies || {});

  if (refreshCookie) {
    const [tokenId] = refreshCookie.split('.');
    if (tokenId) {
      await revokeRefreshToken(tokenId);
    }
  }

  clearAuthCookies(res);
  res.status(204).end();
}) satisfies RequestHandler);

authRouter.post('/refresh', (async (req, res) => {
  const refreshCookie = readRefreshCookie(req.cookies || {});
  const [tokenId, refreshSecret] = String(refreshCookie || '').split('.');

  if (!tokenId || !refreshSecret) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  try {
    const tokenRecord = await findRefreshTokenById(tokenId);

    if (
      !tokenRecord ||
      tokenRecord.revoked_at ||
      tokenRecord.token_hash !== hashToken(refreshSecret) ||
      isPast(new Date(tokenRecord.expires_at))
    ) {
      sendApiError(res, 401, 'Authentication required.', 'auth_required');
      return;
    }

    const user = await findUserById(tokenRecord.user_id);
    if (!user) {
      sendApiError(res, 401, 'Authentication required.', 'auth_required');
      return;
    }

    const publicUser = toPublicUser(user);
    const nextRefreshSecret = createOpaqueToken();
    const nextRefreshRecord = await createRefreshToken({
      userId: user.id,
      tokenHash: hashToken(nextRefreshSecret),
      expiresAt: addDays(new Date(), getAuthConfig().refreshTokenTtlDays)
    });
    await revokeRefreshToken(tokenRecord.id, nextRefreshRecord.id);

    setAuthCookies(res, createSessionAccessToken(publicUser), `${nextRefreshRecord.id}.${nextRefreshSecret}`);

    res.json({ user: publicUser });
  } catch {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
  }
}) satisfies RequestHandler);

authRouter.get('/me', requireAuth, ((req, res) => {
  res.json({ user: req.user });
}) satisfies RequestHandler);

authRouter.post('/logout-all', requireAuth, (async (req, res) => {
  if (!req.user) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  await revokeUserRefreshTokens(req.user.id);
  clearAuthCookies(res);
  res.status(204).end();
}) satisfies RequestHandler);

function createSessionAccessToken(user: ReturnType<typeof toPublicUser>): string {
  return signAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
    emailVerified: user.emailVerified
  });
}
