import { createHash } from 'node:crypto';

/**
 * Matches PHP `hash_password()` in easyappointments-logs/application/helpers/password_helper.php
 */
export function hashPasswordEa(salt: string, password: string): string {
  const half = Math.floor(salt.length / 2);
  let hash = createHash('sha256')
    .update(salt.slice(0, half) + password + salt.slice(half), 'utf8')
    .digest('hex');
  for (let i = 0; i < 100_000; i++) {
    hash = createHash('sha256').update(hash, 'utf8').digest('hex');
  }
  return hash;
}
