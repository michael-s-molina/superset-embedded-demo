import fs from 'fs';
import jwt from 'jsonwebtoken';

// Environment variables for JWT signing
// GUEST_TOKEN_SECRET_FILE: path to a file containing the secret (preferred for production)
// GUEST_TOKEN_SECRET: inline secret value (for development/testing)
const GUEST_TOKEN_SECRET_FILE = process.env.GUEST_TOKEN_SECRET_FILE;
const GUEST_TOKEN_SECRET = process.env.GUEST_TOKEN_SECRET;
const GUEST_TOKEN_AUDIENCE = process.env.GUEST_TOKEN_AUDIENCE;

// Configurable header name for username (default: x-internalauth-username)
export const JWT_USERNAME_HEADER = process.env.JWT_USERNAME_HEADER || 'x-internalauth-username';

// Cached secret to avoid reading the file on every request
let cachedSecret: string | null = null;

/**
 * Check if JWT signing is enabled (i.e., a secret is configured)
 */
export const isJwtSigningEnabled = (): boolean => {
  return Boolean(GUEST_TOKEN_SECRET_FILE || GUEST_TOKEN_SECRET);
};

/**
 * Get the guest token secret from file or environment variable
 */
const getGuestTokenSecret = (): string => {
  if (cachedSecret !== null) {
    return cachedSecret;
  }

  // Try file-based secret first
  if (GUEST_TOKEN_SECRET_FILE) {
    try {
      cachedSecret = fs.readFileSync(GUEST_TOKEN_SECRET_FILE, 'utf-8').trim();
      return cachedSecret;
    } catch (error) {
      throw new Error(`Failed to read secret from file ${GUEST_TOKEN_SECRET_FILE}: ${error}`);
    }
  }

  // Fall back to inline secret
  if (GUEST_TOKEN_SECRET) {
    cachedSecret = GUEST_TOKEN_SECRET;
    return cachedSecret;
  }

  throw new Error('No JWT secret configured. Set GUEST_TOKEN_SECRET_FILE or GUEST_TOKEN_SECRET environment variable.');
};

// Token expiration time in seconds (default: 5 minutes)
const TOKEN_EXPIRATION_SECONDS = parseInt(process.env.GUEST_TOKEN_EXPIRATION_SECONDS || '300', 10);

// GuestToken payload schema (matches Superset's guest_token.py)
interface GuestTokenUser {
  username: string;
  first_name: string;
  last_name: string;
}

interface GuestTokenResource {
  type: 'dashboard';
  id: string | number;
}

interface GuestTokenRlsRule {
  dataset?: string;
  clause: string;
}

interface GuestTokenPayload {
  iat: number;
  exp: number;
  user: GuestTokenUser;
  resources: GuestTokenResource[];
  rls_rules: GuestTokenRlsRule[];
  type: 'guest';
}

export interface GenerateGuestTokenRequest {
  username: string;
  dashboardId: string;
  rls: Array<{ clause: string }>;
}

/**
 * Generate a guest token by signing a JWT with the configured secret.
 * This is an alternative to requesting tokens from Superset's API.
 */
export const generateGuestToken = (request: GenerateGuestTokenRequest): string => {
  const secret = getGuestTokenSecret();

  const now = Math.floor(Date.now() / 1000);

  const payload: GuestTokenPayload = {
    iat: now,
    exp: now + TOKEN_EXPIRATION_SECONDS,
    user: {
      username: request.username,
      first_name: 'Guest',
      last_name: 'User',
    },
    resources: [
      {
        type: 'dashboard',
        id: request.dashboardId,
      },
    ],
    rls_rules: request.rls.map((rule) => ({
      clause: rule.clause,
    })),
    type: 'guest',
  };

  const options: jwt.SignOptions = {
    algorithm: 'HS256',
  };

  if (GUEST_TOKEN_AUDIENCE) {
    options.audience = GUEST_TOKEN_AUDIENCE;
  }

  return jwt.sign(payload, secret, options);
};
