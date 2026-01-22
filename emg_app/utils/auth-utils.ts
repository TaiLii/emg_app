/**
 * Authentication Utilities
 * - Password validation
 * - Token management
 * - Input validation
 */

// Password validation utilities (works on RN and Web)
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (!PASSWORD_REGEX.test(password)) {
    errors.push('Password must contain uppercase, lowercase, number, and special character');
  }

  return { valid: errors.length === 0, errors };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!username || username.length === 0) {
    errors.push('Username is required');
    return { valid: false, errors };
  }

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username.length > 30) {
    errors.push('Username must be less than 30 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Simple secure hash using native JS (works in RN)
 * For production, use bcrypt via a backend service
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Generate random salt
    const salt = generateRandomSalt(16);
    
    // Create deterministic hash
    const hash = hashString(password + salt);
    
    return `${salt}:${hash}`;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const parts = hash.split(':');
    if (parts.length !== 2) {
      console.error('Invalid hash format');
      return false;
    }

    const [salt, storedHash] = parts;
    if (!salt || !storedHash) {
      console.error('Salt or hash missing');
      return false;
    }

    const computedHash = hashString(password + salt);
    const match = computedHash === storedHash;
    
    if (!match) {
      console.log('Hash mismatch - computed:', computedHash, 'stored:', storedHash);
    }
    
    return match;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Token management
 */
export const generateAccessToken = (userId: string, expiresIn: number = 3600000): { token: string; expiresAt: number } => {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + expiresIn;
  
  // Simple token format: userId.timestamp.expiresAt
  const token = `${userId}.${issuedAt}.${expiresAt}`;
  
  return { token, expiresAt };
};

export const generateRefreshToken = (userId: string): string => {
  return `${userId}.${Date.now()}.${generateRandomSalt(16)}`;
};

export const validateToken = (token: string): { valid: boolean; userId?: string; expiresAt?: number } => {
  try {
    const [userId, issuedAt, expiresAt] = token.split('.');
    
    if (!userId || !issuedAt || !expiresAt) {
      return { valid: false };
    }

    const expiresAtNum = parseInt(expiresAt, 10);
    
    if (Date.now() > expiresAtNum) {
      return { valid: false };
    }

    return { valid: true, userId, expiresAt: expiresAtNum };
  } catch (error) {
    return { valid: false };
  }
};

// Helper functions
const generateRandomSalt = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const hashString = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure consistent output even for negative numbers
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export const generateId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
};
