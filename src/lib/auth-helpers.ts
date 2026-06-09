import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Get the JWT secret from environment variables.
 * Throws if not configured (no more hardcoded fallbacks).
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT secret not configured. Set NEXTAUTH_SECRET or AUTH_SECRET environment variable."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Get the current member from the member-token cookie.
 * Returns null if not authenticated or token is invalid.
 */
export async function getCurrentMember() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("member-token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      memberId: payload.memberId as number,
      memberName: payload.memberName as string,
      memberEmail: payload.memberEmail as string,
      memberCategory: payload.memberCategory as string,
    };
  } catch {
    return null;
  }
}

/**
 * Require admin role from NextAuth session token.
 * Returns the token if admin, or null if not authorized.
 */
export async function requireAdmin(req: NextRequest) {
  const secretStr = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secretStr) {
    throw new Error("JWT secret not configured. Set NEXTAUTH_SECRET or AUTH_SECRET environment variable.");
  }
  const token = await getToken({
    req: req as any,
    secret: secretStr,
  });

  if (!token || token.role !== "ADMIN") {
    return null;
  }

  return token;
}
