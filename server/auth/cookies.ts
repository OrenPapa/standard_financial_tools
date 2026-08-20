import type { Response } from 'express';

import { getAuthConfig } from './config.js';

const ACCESS_COOKIE = 'pfm_access';
const REFRESH_COOKIE = 'pfm_refresh';

function baseCookieOptions() {
  const config = getAuthConfig();

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.cookieSecure,
    path: '/api'
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const config = getAuthConfig();

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: 15 * 60 * 1000
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, baseCookieOptions());
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
}

export function readAccessCookie(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[ACCESS_COOKIE];
}

export function readRefreshCookie(cookies: Record<string, string | undefined>): string | undefined {
  return cookies[REFRESH_COOKIE];
}
