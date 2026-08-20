import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { readAccessCookie } from './cookies.js';
import { findUserById, toPublicUser } from './repository.js';
import { verifyAccessToken } from './jwt.js';
import { sendApiError } from '../utils/http.js';
import type { PublicUser } from './repository.js';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const accessToken = readAccessCookie(req.cookies || {});

  if (!accessToken) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  try {
    const payload = verifyAccessToken(accessToken);
    const user = await findUserById(payload.sub);

    if (!user) {
      sendApiError(res, 401, 'Authentication required.', 'auth_required');
      return;
    }

    req.user = toPublicUser(user);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendApiError(res, 401, 'Session expired.', 'token_expired');
      return;
    }

    sendApiError(res, 401, 'Authentication required.', 'auth_required');
  }
};
