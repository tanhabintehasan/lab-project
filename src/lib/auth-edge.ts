/**
 * Edge-compatible authentication helpers for Next.js Middleware.
 * Does NOT import Node-only modules (bcrypt, pg, etc.).
 */

import { jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

const COOKIE_NAME = 'auth-token';

let _jwtSecret: Uint8Array | undefined;

function getJwtSecret(): Uint8Array {
  if (_jwtSecret) return _jwtSecret;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  _jwtSecret = new TextEncoder().encode(secret);
  return _jwtSecret;
}

export interface EdgeJWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  name?: string;
  avatar?: string;
  locale?: string;
  phone?: string;
}

export async function verifyTokenEdge(token: string): Promise<EdgeJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as EdgeJWTPayload;
  } catch (error: any) {
    // Log non-expiration errors for debugging
    if (error?.code !== 'ERR_JWT_EXPIRED') {
      console.error('verifyTokenEdge error:', error?.code || error?.message || error);
    }
    return null;
  }
}

export function getTokenFromRequest(request: { cookies: { get(name: string): { value: string } | undefined } }): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value;
}
