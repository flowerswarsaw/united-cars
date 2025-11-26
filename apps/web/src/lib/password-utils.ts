import bcrypt from 'bcryptjs';

/**
 * Generate a temporary password
 * Format: 3 words + 3 numbers (e.g., "BlueFoxRiver472")
 * Easy to read over phone, type, and remember temporarily
 */
export function generateTemporaryPassword(): string {
  const words = [
    'Blue', 'Red', 'Green', 'Gold', 'Swift', 'Bright',
    'Fox', 'Wolf', 'Eagle', 'Tiger', 'Bear', 'Hawk',
    'River', 'Ocean', 'Lake', 'Sky', 'Storm', 'Cloud'
  ];

  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const word3 = words[Math.floor(Math.random() * words.length)];
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${word1}${word2}${word3}${numbers}`;
}

/**
 * Hash password with bcrypt (10 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Requirements: 8+ characters, at least one uppercase, one lowercase, one number
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}
