import { getAuthConfig } from './config.js';

export interface VerificationEmailInput {
  email: string;
  token: string;
}

export async function sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
  const verificationUrl = new URL('/api/auth/verify-email', getAuthConfig().apiOrigin);
  verificationUrl.searchParams.set('token', input.token);

  console.log(`Email verification link for ${input.email}: ${verificationUrl.toString()}`);
}
