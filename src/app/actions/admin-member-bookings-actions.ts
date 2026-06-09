"use server";

import { prisma } from "@/lib/prisma";

export interface MemberBookingRecord {
  bookingId: string;
  eventName: string;
  eventDate: Date;
  memberId: number;
  memberName: string;
  seatCount: number;
  bookingDate: Date;
}

export async function getAdminMemberBookings(eventId?: string) {
  try {
    const allBookings = await prisma.booking.findMany({
      where: eventId ? { eventId } : undefined,
      select: {
        id: true,
        eventId: true,
        eventName: true,
        eventDate: true,
        bookingDate: true,
        attendees: true,
        paymentInfo: true,
      },
      orderBy: { bookingDate: "desc" },
    });

    const records: MemberBookingRecord[] = [];

    for (const b of allBookings) {
      const pi = b.paymentInfo as any;
      if (pi?.method !== "member-benefit") continue;

      const atts = b.attendees as any[];
      const members = Array.isArray(atts)
        ? atts.filter((a) => a.isMember && a.memberId)
        : [];

      if (members.length === 0) continue;

      const memberId = parseInt(members[0].memberId, 10);
      const memberName = pi?.memberName || members[0].attendeeName || "Member";

      records.push({
        bookingId: b.id,
        eventName: b.eventName,
        eventDate: b.eventDate,
        memberId,
        memberName,
        seatCount: atts.length,
        bookingDate: b.bookingDate,
      });
    }

    return { success: true, records };
  } catch (error) {
    console.error("Error fetching member bookings:", error);
    return { success: false, records: [], error: "Failed to fetch member bookings" };
  }
}

export async function getMemberBookingStats() {
  try {
    const allBookings = await prisma.booking.findMany({
      select: {
        id: true,
        attendees: true,
        paymentInfo: true,
      },
    });

    const memberBookings = allBookings.filter((b) => {
      const pi = b.paymentInfo as any;
      return pi?.method === "member-benefit";
    });

    const totalFreeSeats = memberBookings.reduce((sum, b) => {
      const atts = b.attendees as any[];
      return sum + (Array.isArray(atts) ? atts.length : 0);
    }, 0);

    const uniqueMemberIds = new Set<number>();
    for (const b of memberBookings) {
      const atts = b.attendees as any[];
      if (Array.isArray(atts)) {
        for (const a of atts) {
          if (a.isMember && a.memberId) {
            uniqueMemberIds.add(parseInt(a.memberId, 10));
          }
        }
      }
    }

    return {
      success: true,
      stats: {
        totalBookings: memberBookings.length,
        totalFreeSeats,
        uniqueMembers: uniqueMemberIds.size,
      },
    };
  } catch (error) {
    console.error("Error fetching member booking stats:", error);
    return { success: false, error: "Failed to fetch stats" };
  }
}
