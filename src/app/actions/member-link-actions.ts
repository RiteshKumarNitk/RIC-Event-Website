"use server";

import { prisma } from "@/lib/prisma";

export async function linkMemberToUser(userId: string, memberId: number, phone: string) {
  try {
    const member = await prisma.member.findFirst({
      where: { memberId, phone },
    });

    if (!member) {
      return { success: false, error: "Invalid Member ID or phone number." };
    }

    if (member.userId && member.userId !== userId) {
      return { success: false, error: "This member is already linked to another account." };
    }

    await prisma.member.update({
      where: { id: member.id },
      data: { userId },
    });

    return {
      success: true,
      member: {
        id: member.id,
        memberId: member.memberId,
        name: member.name,
        categoryType: member.categoryType,
      },
    };
  } catch (error) {
    console.error("Error linking member:", error);
    return { success: false, error: "Failed to link member account." };
  }
}

export async function getLinkedMember(userId: string) {
  try {
    const member = await prisma.member.findUnique({
      where: { userId },
    });

    if (!member) return { success: true, member: null };

    return {
      success: true,
      member: {
        id: member.id,
        memberId: member.memberId,
        name: member.name,
        categoryType: member.categoryType,
        categoryAcronym: member.categoryAcronym,
      },
    };
  } catch (error) {
    console.error("Error fetching linked member:", error);
    return { success: false, error: "Failed to fetch member." };
  }
}

export async function verifyMemberForSeatSelection(userId: string, eventId: string) {
  try {
    const member = await prisma.member.findUnique({
      where: { userId },
    });

    if (!member) return { success: true, isMember: false };

    // Check if this member already used their free quota for this event
    const bookings = await prisma.booking.findMany({
      where: { eventId },
    });

    const alreadyUsed = bookings.some((b) => {
      const attendees = b.attendees as any[];
      return attendees.some(
        (a) => a.isMember && String(a.memberId) === String(member.memberId)
      );
    });

    return {
      success: true,
      isMember: true,
      alreadyUsed,
      member: {
        name: member.name,
        memberId: member.memberId,
        categoryAcronym: member.categoryAcronym,
      },
    };
  } catch (error) {
    console.error("Error verifying member:", error);
    return { success: false, isMember: false, error: "Verification failed." };
  }
}
