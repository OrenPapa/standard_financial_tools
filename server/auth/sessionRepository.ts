import { db } from '../db.js';

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  replaced_by_token_id: string | null;
  created_at: string;
}

export async function createRefreshToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<RefreshTokenRecord> {
  const result = await db.query<RefreshTokenRecord>(
    `
      insert into refresh_tokens (user_id, token_hash, expires_at)
      values ($1, $2, $3)
      returning *
    `,
    [input.userId, input.tokenHash, input.expiresAt]
  );

  return result.rows[0];
}

export async function findRefreshTokenById(id: string): Promise<RefreshTokenRecord | null> {
  const result = await db.query<RefreshTokenRecord>(
    'select * from refresh_tokens where id = $1 limit 1',
    [id]
  );

  return result.rows[0] || null;
}

export async function revokeRefreshToken(id: string, replacementId?: string): Promise<void> {
  await db.query(
    `
      update refresh_tokens
      set revoked_at = now(),
          replaced_by_token_id = $2
      where id = $1 and revoked_at is null
    `,
    [id, replacementId || null]
  );
}

export async function revokeUserRefreshTokens(userId: string): Promise<void> {
  await db.query(
    `
      update refresh_tokens
      set revoked_at = now()
      where user_id = $1 and revoked_at is null
    `,
    [userId]
  );
}
