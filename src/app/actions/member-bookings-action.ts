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
      console.error("[getMemberEventBookings] getCurrentMember() returned null — member-token cookie may be missing or invalid");
      return { success: false, error: "Not authenticated. Please log in again." };
    }

    const memberIdStr = String(currentMember.memberId);

    // Fetch bookings with a reasonable limit and filter in memory
    // (more reliable than string_contains on Json which can silently fail)
    const allBookings = await prisma.booking.findMany({
      select: {
        id: true,
        eventId: true,
        eventName: true,
        eventDate: true,
        bookingDate: true,
        attendees: true,
      },
      orderBy: { bookingDate: "desc" },
      take: 500,
    });

    const memberBookings = allBookings
      .filter((b) => {
        const atts = b.attendees as any[];
        return Array.isArray(atts) && atts.some(
          (a) => String(a.memberId) === memberIdStr
        );
      })
      .map((b) => {
        const atts = b.attendees as any[];
        const memberCount = Array.isArray(atts)
          ? atts.filter((a) => String(a.memberId) === memberIdStr).length
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
    console.error("[getMemberEventBookings] Error:", error);
    return { success: false, error: "Failed to fetch bookings." };
  }
}
