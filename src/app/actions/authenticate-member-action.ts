"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function authenticateMemberAction(
  memberId: string,
  password: string,
  eventId: string
): Promise<{ isValid: boolean; message: string; memberName?: string }> {
  if (!memberId || !password || !eventId) {
    return { isValid: false, message: "Member ID, password, and Event ID are required." };
  }

  try {
    const numericMemberId = parseInt(memberId, 10);
    if (isNaN(numericMemberId)) {
      return { isValid: false, message: "Invalid Member ID format." };
    }

    // 1. Look up the member by their numeric Member ID
    const member = await prisma.member.findFirst({
      where: { memberId: numericMemberId },
      select: {
        id: true,
        memberId: true,
        name: true,
        password: true,
      },
    });

    if (!member) {
      return { isValid: false, message: "Invalid Member ID or password." };
    }

    // 2. Verify the password using bcrypt
    if (!member.password) {
      return { isValid: false, message: "This member does not have a password set. Please contact the administrator." };
    }

    const isPasswordValid = await bcrypt.compare(password, member.password);
    if (!isPasswordValid) {
      return { isValid: false, message: "Invalid Member ID or password." };
    }

    // 3. Check if this member ID has already been used for a booking at this event
    const bookings = await prisma.booking.findMany({
      where: { eventId },
      select: { attendees: true },
    });

    const isMemberIdUsed = bookings.some((booking) => {
      const attendees = booking.attendees as any[];
      return attendees.some(
        (attendee) =>
          attendee.isMember && String(attendee.memberId) === String(member.memberId)
      );
    });

    if (isMemberIdUsed) {
      return {
        isValid: false,
        message: "This Member ID has already been used for a booking at this event.",
      };
    }

    // All checks passed — member is authenticated and eligible
    return {
      isValid: true,
      message: "Member verified! Your ticket is free.",
      memberName: member.name,
    };
  } catch (error) {
    console.error("Error authenticating member:", error);
    return { isValid: false, message: "An unexpected error occurred during verification." };
  }
}
