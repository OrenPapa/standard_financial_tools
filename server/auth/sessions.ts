import { addDays } from '../utils/dates.js';
import { createOpaqueToken, hashToken } from '../utils/tokens.js';
import { getAuthConfig } from './config.js';
import { signAccessToken } from './jwt.js';
import { createRefreshToken } from './sessionRepository.js';
import type { PublicUser } from './repository.js';

export async function createSessionTokens(user: PublicUser) {
  const refreshSecret = createOpaqueToken();
  const refreshTokenHash = hashToken(refreshSecret);
  const refreshRecord = await createRefreshToken({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: addDays(new Date(), getAuthConfig().refreshTokenTtlDays)
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
    emailVerified: user.emailVerified
  });
  return {
    accessToken,
    refreshToken: `${refreshRecord.id}.${refreshSecret}`
  };
}
