import crypto from 'crypto';
import { env } from '@/config/env';

export const ADMIN_COOKIE = 'admin_session';

// Stateless session: the cookie holds an HMAC of the admin email keyed by the
// admin password, so a valid session can be recomputed and checked from env
// alone - no session store needed for a single fixed admin login.
function expectedSessionToken(): string {
  return crypto.createHmac('sha256', env.admin.password).update(env.admin.email).digest('hex');
}

export function verifyCredentials(email: string, password: string): boolean {
  return email === env.admin.email && password === env.admin.password;
}

export function issueSessionToken(): string {
  return expectedSessionToken();
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(expectedSessionToken());
  const actual = Buffer.from(token);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
