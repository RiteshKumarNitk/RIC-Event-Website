

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


