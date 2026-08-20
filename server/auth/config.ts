const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 30;
const DEFAULT_EMAIL_TOKEN_TTL_HOURS = 24;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production.`);
  }

  return `dev-only-${name.toLowerCase()}-change-me`;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
}

export function getAuthConfig() {
  return {
    accessTokenSecret: requiredEnv('JWT_ACCESS_SECRET'),
    refreshTokenSecret: requiredEnv('JWT_REFRESH_SECRET'),
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || DEFAULT_ACCESS_TOKEN_TTL,
    refreshTokenTtlDays: numberEnv('REFRESH_TOKEN_TTL_DAYS', DEFAULT_REFRESH_TOKEN_TTL_DAYS),
    emailTokenTtlHours: numberEnv('EMAIL_TOKEN_TTL_HOURS', DEFAULT_EMAIL_TOKEN_TTL_HOURS),
    appOrigin: process.env.APP_ORIGIN || 'http://127.0.0.1:5173',
    apiOrigin: process.env.API_ORIGIN || 'http://127.0.0.1:3000',
    cookieSecure: process.env.NODE_ENV === 'production'
  };
}
