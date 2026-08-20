import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { getAuthConfig } from './config.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  emailVerified: boolean;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const config = getAuthConfig();
  const options: SignOptions = {
    expiresIn: config.accessTokenTtl as SignOptions['expiresIn']
  };

  return jwt.sign(payload, config.accessTokenSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getAuthConfig().accessTokenSecret) as AccessTokenPayload;
}
