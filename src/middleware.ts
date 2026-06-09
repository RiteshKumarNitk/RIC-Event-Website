import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/server-auth';

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
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    });

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
