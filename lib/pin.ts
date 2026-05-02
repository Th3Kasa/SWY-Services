import { scryptSync, timingSafeEqual, randomBytes } from 'crypto';

export function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 64).toString('hex');
}

export function makeStoredPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${hashPin(pin, salt)}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  try {
    const attempt = hashPin(pin, salt);
    return timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}
