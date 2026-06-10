"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth-helpers";

export interface MemberEventBookingSummary {
  eventId: string;
  eventName: string;
  eventDate: Date;
  bookingCount: number; // Number of free member seats booked
  bookingDate: Date;
  bookingId: string; // Most recent booking ID for this event (for linking to confirmation)
}

export async function getMemberEventBookings(): Promise<{
  success: boolean;
  bookings?: MemberEventBookingSummary[];
  error?: string;
}> {
  try {
    const currentMember = await getCurrentMember();
    if (!currentMember) {
      return { success: false, error: "Not authenticated." };
    }

    // Use DB-level filtering: only fetch bookings whose attendees JSON mentions this memberId
    const candidateBookings = await prisma.booking.findMany({
      where: {
        attendees: {
          string_contains: String(currentMember.memberId),
        },
      },
      select: {
        id: true,
        eventId: true,
        eventName: true,
        eventDate: true,
        bookingDate: true,
        attendees: true,
      },
      orderBy: { bookingDate: "desc" },
    });

    // Precise in-memory filter: verify isMember flag matches
    const memberBookings = candidateBookings
      .filter((b) => {
        const atts = b.attendees as any[];
        return Array.isArray(atts) && atts.some(
          (a) => a.isMember && String(a.memberId) === String(currentMember.memberId)
        );
      })
      .map((b) => {
        const atts = b.attendees as any[];
        const memberCount = Array.isArray(atts)
          ? atts.filter((a) => a.isMember && String(a.memberId) === String(currentMember.memberId)).length
          : 0;
        return {
          eventId: b.eventId,
          eventName: b.eventName,
          eventDate: b.eventDate,
          bookingCount: memberCount,
          bookingDate: b.bookingDate,
          bookingId: b.id,
        };
      });

    return { success: true, bookings: memberBookings };
  } catch (error) {
    console.error("Error fetching member bookings:", error);
    return { success: false, error: "Failed to fetch bookings." };
  }
}
