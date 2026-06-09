import { cookies } from "next/headers";
import { jwtVerify } from "jose";
/**
 * Get the JWT secret from environment variables.
 * Throws if not configured.
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT secret not configured. Set NEXTAUTH_SECRET or AUTH_SECRET environment variable."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Get the raw session token string from cookies.
 * Works in both server actions and route handlers.
 */
async function getSessionTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  // NextAuth v5 uses "authjs.session-token", v4 uses "next-auth.session-token"
  const token =
    cookieStore.get("authjs.session-token")?.value ||
    cookieStore.get("__Secure-authjs.session-token")?.value ||
    cookieStore.get("next-auth.session-token")?.value ||
    cookieStore.get("__Secure-next-auth.session-token")?.value;
  return token || null;
}

/**
 * Verify a JWT token and return the payload.
 */
async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload;
}

/**
 * Require admin role. Works in server actions (no request needed).
 * Reads the session token from cookies and verifies it.
 */
export async function requireAdminSession() {
  const token = await getSessionTokenFromCookies();
  if (!token) {
    throw new Error("Unauthorized: you must be logged in.");
  }

  try {
    const payload = await verifyToken(token);
    if (payload.role !== "ADMIN") {
      throw new Error("Forbidden: admin access required.");
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Forbidden")) {
      throw error;
    }
    throw new Error("Unauthorized: invalid or expired session.");
  }
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given key (e.g., IP address).
 * Returns { allowed: boolean, retryAfterMs?: number }.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true };
}

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
