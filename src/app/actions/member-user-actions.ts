"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth-helpers";

/**
 * For members who logged in via the member JWT system but don't have a
 * regular NextAuth user account, this action finds or creates a User
 * record so they can complete the booking flow (which requires a userId).
 */
export async function findOrCreateMemberUser() {
  try {
    const currentMember = await getCurrentMember();
    if (!currentMember) {
      return { success: false, error: "No active member session found." };
    }

    const member = await prisma.member.findUnique({
      where: { memberId: currentMember.memberId },
    });

    if (!member) {
      return { success: false, error: "Member record not found." };
    }

    // If member already has a linked user account, return it
    if (member.userId) {
      return { success: true, userId: member.userId };
    }

    // Check if a User already exists with this member's email
    const existingUser = await prisma.user.findUnique({
      where: { email: member.email },
    });

    if (existingUser) {
      // Link the member to this existing user
      await prisma.member.update({
        where: { id: member.id },
        data: { userId: existingUser.id },
      });
      return { success: true, userId: existingUser.id };
    }

    // Create a User record and link it to the member atomically
    const { user } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: member.name,
          email: member.email,
          role: "USER",
        },
      });

      await tx.member.update({
        where: { id: member.id },
        data: { userId: user.id },
      });

      return { user };
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Error finding/creating member user:", error);
    return { success: false, error: "Failed to prepare member booking." };
  }
}
