import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './config/i18n';

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

export default function proxy(request: NextRequest) {
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

  if (isProtected) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const locale = getLocaleFromPathname(pathname);

      const loginPath =
        locale === defaultLocale ? '/auth/login' : `/${locale}/auth/login`;

      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('callbackUrl', cleanPath);

      return NextResponse.redirect(loginUrl);
    }
  }

  const response = intlMiddleware(request);
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
