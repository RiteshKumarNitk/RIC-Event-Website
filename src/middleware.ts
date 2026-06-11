import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Rate limit auth endpoints: 10 requests per minute per IP
const AUTH_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };
// Rate limit API endpoints: 30 requests per minute per IP
const API_RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 };

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Rate limit auth endpoints
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/signup') ||
    pathname.startsWith('/api/auth/member-login')
  ) {
    const { allowed, retryAfterMs } = checkRateLimit(
      `auth:${ip}`,
      AUTH_RATE_LIMIT.maxRequests,
      AUTH_RATE_LIMIT.windowMs
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((retryAfterMs || 60000) / 1000)) } }
      );
    }
  }

  // Rate limit general API routes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const { allowed, retryAfterMs } = checkRateLimit(
      `api:${ip}`,
      API_RATE_LIMIT.maxRequests,
      API_RATE_LIMIT.windowMs
    );
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((retryAfterMs || 60000) / 1000)) } }
      );
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';
    
    // Also check the legacy next-auth cookie name just in case
    const legacyCookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
    
    // Get token using NextAuth v5 cookie name (salt)
    // Must pass both cookieName AND salt — cookieName is used by SessionStore
    // to look up the cookie from headers, salt is used for JWT decryption.
    let token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
      cookieName: cookieName,
      salt: cookieName,
    });

    // Fallback for NextAuth v4 compatibility
    if (!token) {
      token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
        cookieName: legacyCookieName,
        salt: legacyCookieName,
      });
    }

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== 'ADMIN') {
      const forbiddenUrl = new URL('/', request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
