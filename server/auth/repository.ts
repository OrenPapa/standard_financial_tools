import { db } from '../db.js';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: Boolean(user.email_verified_at)
  };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await db.query<UserRecord>(
    'select * from users where lower(email) = lower($1) limit 1',
    [email]
  );

  return result.rows[0] || null;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await db.query<UserRecord>(
    'select * from users where lower(username) = lower($1) limit 1',
    [username]
  );

  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await db.query<UserRecord>(
    'select * from users where id = $1 limit 1',
    [id]
  );

  return result.rows[0] || null;
}

export async function createUser(input: {
  username: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const result = await db.query<UserRecord>(
    `
      insert into users (username, email, password_hash)
      values ($1, lower($2), $3)
      returning *
    `,
    [input.username, input.email, input.passwordHash]
  );

  return result.rows[0];
}

export async function markUserEmailVerified(userId: string): Promise<UserRecord> {
  const result = await db.query<UserRecord>(
    `
      update users
      set email_verified_at = coalesce(email_verified_at, now()),
          updated_at = now()
      where id = $1
      returning *
    `,
    [userId]
  );

  return result.rows[0];
}
