import crypto from 'crypto';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_OTP_ATTEMPTS = 5;

export function generateOtp(): string {
  // 6-digit numeric code, zero-padded, cryptographically random.
  return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

export function newOtpExpiry(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}

export function isExpired(expiresAt: string): boolean {
  return !expiresAt || Date.now() > new Date(expiresAt).getTime();
}
