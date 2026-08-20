import { db } from '../db.js';

export interface EmailVerificationTokenRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export async function createEmailVerificationToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<EmailVerificationTokenRecord> {
  const result = await db.query<EmailVerificationTokenRecord>(
    `
      insert into email_verification_tokens (user_id, token_hash, expires_at)
      values ($1, $2, $3)
      returning *
    `,
    [input.userId, input.tokenHash, input.expiresAt]
  );

  return result.rows[0];
}

export async function findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationTokenRecord | null> {
  const result = await db.query<EmailVerificationTokenRecord>(
    'select * from email_verification_tokens where token_hash = $1 limit 1',
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function markEmailVerificationTokenUsed(id: string): Promise<void> {
  await db.query(
    `
      update email_verification_tokens
      set used_at = now()
      where id = $1 and used_at is null
    `,
    [id]
  );
}
