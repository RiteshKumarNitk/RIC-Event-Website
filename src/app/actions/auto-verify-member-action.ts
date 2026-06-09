"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth-helpers";

/**
 * Auto-verifies a member from their JWT session (member-token cookie).
 * Unlike authenticateMemberAction, this does NOT require a password
 * because the member is already authenticated via the JWT login system.
 * 
 * Use this in the checkout flow to auto-fill member details without
 * requiring the user to re-enter their Member ID and password.
 */
export async function autoVerifyMemberAction(
  eventId: string
): Promise<{
  isValid: boolean;
  message: string;
  memberName?: string;
  memberId?: number;
  alreadyUsed?: boolean;
}> {
  try {
    // 1. Get the member from their JWT session cookie
    const currentMember = await getCurrentMember();
    if (!currentMember) {
      return { isValid: false, message: "No active member session found." };
    }

    // 2. Look up the full member record
    const member = await prisma.member.findUnique({
      where: { memberId: currentMember.memberId },
      select: {
        memberId: true,
        name: true,
      },
    });

    if (!member) {
      return { isValid: false, message: "Member record not found." };
    }

    // 3. Check if this member already used their free booking for this event
    const bookings = await prisma.booking.findMany({
      where: { eventId },
      select: { attendees: true },
    });

    const alreadyUsed = bookings.some((booking) => {
      const attendees = booking.attendees as any[];
      return attendees.some(
        (attendee) =>
          attendee.isMember &&
          String(attendee.memberId) === String(member.memberId)
      );
    });

    return {
      isValid: true,
      message: alreadyUsed
        ? "You've already used your free member booking for this event."
        : "Member verified via session! Your ticket is free.",
      memberName: member.name,
      memberId: member.memberId,
      alreadyUsed,
    };
  } catch (error) {
    console.error("Error auto-verifying member:", error);
    return { isValid: false, message: "An unexpected error occurred." };
  }
}
