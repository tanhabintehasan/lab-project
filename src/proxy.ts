import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config/i18n';
import { verifyTokenEdge } from './lib/auth-edge';
import { checkRouteAccess, ROLES } from './lib/rbac';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

const protectedPrefixes = ['/dashboard', '/admin', '/lab-portal', '/enterprise'];

function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || '/';
    }
  }
  return pathname;
}

function getLocaleFromPathname(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale as string;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  return response;
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const cleanPath = getPathnameWithoutLocale(pathname);

  // Block path traversal in upload paths
  if (
    pathname.startsWith('/uploads/') &&
    (pathname.includes('..') || pathname.includes('%00'))
  ) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
  );

  const locale = getLocaleFromPathname(pathname);
  const loginPath =
    locale === defaultLocale ? '/auth/login' : `/${locale}/auth/login`;

  if (isProtected) {
    const token = request.cookies.get('auth-token')?.value;

    // No token → redirect to login
    if (!token) {
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('callbackUrl', cleanPath);
      return NextResponse.redirect(loginUrl);
    }

    // Verify JWT
    const payload = await verifyTokenEdge(token);
    if (!payload) {
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('callbackUrl', cleanPath);
      return NextResponse.redirect(loginUrl);
    }

    // ─── RBAC: Strict role check for route prefixes ───────────
    const role = payload.role;

    // /admin requires SUPER_ADMIN or FINANCE_ADMIN (strict string comparison)
    if (cleanPath.startsWith('/admin')) {
      const allowed = role === ROLES.SUPER_ADMIN || role === ROLES.FINANCE_ADMIN;
      if (!allowed) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // /lab-portal requires LAB_MANAGER, TECHNICIAN, or LAB_PARTNER (strict string comparison)
    if (cleanPath.startsWith('/lab-portal')) {
      const allowed =
        role === ROLES.LAB_MANAGER ||
        role === ROLES.TECHNICIAN ||
        role === ROLES.LAB_PARTNER;
      if (!allowed) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Generic RBAC check via centralized rule engine (future-proof)
    if (!checkRouteAccess(role, cleanPath)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  const response = intlMiddleware(request);
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
