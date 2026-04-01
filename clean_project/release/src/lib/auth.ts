import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET = new TextEncoder().encode(jwtSecret);
const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'auth-token';

export interface JWTPayload extends JoseJWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  name?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('verifyToken error:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return payload;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

/** Build Set-Cookie header for HttpOnly secure session cookie */
export function buildSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days
  const isProd = process.env.NODE_ENV === 'production';

  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

/** Build Set-Cookie header to clear the session cookie */
export function buildClearCookie(): string {
  const isProd = process.env.NODE_ENV === 'production';

  return [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export { COOKIE_NAME };

export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: string): boolean {
  return ['SUPER_ADMIN', 'FINANCE_ADMIN'].includes(role);
}

export function isLabPartner(role: string): boolean {
  return role === 'LAB_PARTNER';
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  VISITOR: ['view:public'],
  CUSTOMER: [
    'view:public',
    'create:order',
    'view:own-orders',
    'create:rfq',
    'view:own-rfqs',
    'view:own-reports',
    'manage:own-wallet',
    'manage:own-profile',
  ],
  ENTERPRISE_MEMBER: [
    'view:public',
    'create:order',
    'view:company-orders',
    'create:rfq',
    'view:company-rfqs',
    'view:company-reports',
    'manage:company-wallet',
    'manage:own-profile',
    'view:company-members',
  ],
  LAB_PARTNER: [
    'view:public',
    'view:assigned-orders',
    'update:assigned-orders',
    'manage:samples',
    'upload:reports',
    'manage:lab-equipment',
  ],
  TECHNICIAN: [
    'view:assigned-tasks',
    'update:samples',
    'update:testing-status',
    'upload:reports',
  ],
  FINANCE_ADMIN: [
    'view:all-orders',
    'manage:payments',
    'manage:wallets',
    'manage:invoices',
    'manage:referrals',
    'view:analytics',
  ],
  SUPER_ADMIN: ['*'],
};
