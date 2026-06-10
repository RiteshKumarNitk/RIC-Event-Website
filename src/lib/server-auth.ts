

import { auth } from "@/auth";

/**
 * Require admin role. Works in server actions (no request needed).
 * Uses NextAuth v5's official auth() function.
 */
export async function requireAdminSession() {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      throw new Error("Unauthorized: you must be logged in.");
    }

    if ((session.user as any).role !== "ADMIN") {
      throw new Error("Forbidden: admin access required.");
    }
    
    return session.user;
  } catch (error) {
    console.error("[requireAdminSession] Authentication error:", error);
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
