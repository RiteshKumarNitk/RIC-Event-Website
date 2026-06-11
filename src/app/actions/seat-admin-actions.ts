"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/server-auth";

// ─── Types ───
export interface OccupiedSeatInfo {
  seatId: string;
  type: "booked" | "reserved" | "blocked";
  memberName?: string;
  memberId?: number;
  attendeeName?: string;
  reason?: string;
}

export interface EventSeatDetails {
  occupied: OccupiedSeatInfo[];
  blocked: { seatId: string; reason?: string }[];
}

export async function getBlockedSeats(eventId: string) {
  try {
    const seats = await prisma.blockedSeat.findMany({
      where: { eventId },
    });
    return { success: true, seats: seats.map(s => ({ seatId: s.seatId, reason: s.reason })) };
  } catch (error) {
    console.error("Error fetching blocked seats:", error);
    return { success: false, error: "Failed to fetch blocked seats" };
  }
}

export async function toggleBlockSeat(eventId: string, seatId: string, reason?: string) {
  try {
    await requireAdminSession();
    const existing = await prisma.blockedSeat.findUnique({
      where: { eventId_seatId: { eventId, seatId } },
    });

    if (existing) {
      await prisma.blockedSeat.delete({ where: { id: existing.id } });
    } else {
      await prisma.blockedSeat.create({
        data: { eventId, seatId, reason: reason || null },
      });
    }

    revalidatePath(`/events/${eventId}/seats`);
    return { success: true, nowBlocked: !existing };
  } catch (error) {
    console.error("Error toggling blocked seat:", error);
    return { success: false, error: "Failed to toggle block" };
  }
}

export async function blockMultipleSeats(eventId: string, seatIds: string[]) {
  try {
    await requireAdminSession();
    const existing = await prisma.blockedSeat.findMany({
      where: { eventId, seatId: { in: seatIds } },
      select: { seatId: true },
    });
    const existingSet = new Set(existing.map(s => s.seatId));
    const newSeats = seatIds.filter(s => !existingSet.has(s));

    if (newSeats.length > 0) {
      await prisma.blockedSeat.createMany({
        data: newSeats.map(seatId => ({ eventId, seatId })),
      });
    }

    revalidatePath(`/events/${eventId}/seats`);
    return { success: true, blocked: newSeats.length };
  } catch (error) {
    console.error("Error blocking multiple seats:", error);
    return { success: false, error: "Failed to block seats" };
  }
}

export async function unblockAllSeats(eventId: string) {
  try {
    await requireAdminSession();
    const { count } = await prisma.blockedSeat.deleteMany({ where: { eventId } });
    revalidatePath(`/events/${eventId}/seats`);
    return { success: true, count };
  } catch (error) {
    console.error("Error unblocking all seats:", error);
    return { success: false, error: "Failed to unblock seats" };
  }
}

export async function getEventSeatDetails(eventId: string): Promise<{
  success: boolean;
  details?: EventSeatDetails;
  error?: string;
}> {
  try {
    const [bookings, blockedSeats, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: { eventId },
        select: { attendees: true },
      }),
      prisma.blockedSeat.findMany({
        where: { eventId },
        select: { seatId: true, reason: true },
      }),
      prisma.seatReservation.findMany({
        where: {
          eventId,
          status: { in: ["RESERVED", "CONFIRMED"] },
        },
        select: { seatId: true, memberId: true, memberName: true },
      }),
    ]);

    const occupied: OccupiedSeatInfo[] = [];

    // Add booked seats with attendee/member info
    for (const booking of bookings) {
      const attendees = booking.attendees as any[];
      if (Array.isArray(attendees)) {
        for (const a of attendees) {
          if (a.seatId) {
            occupied.push({
              seatId: a.seatId,
              type: "booked",
              memberName: a.isMember ? a.attendeeName : undefined,
              memberId: a.memberId ? Number(a.memberId) : undefined,
              attendeeName: a.attendeeName,
            });
          }
        }
      }
    }

    // Add reserved seats
    for (const r of reservations) {
      occupied.push({
        seatId: r.seatId,
        type: "reserved",
        memberName: r.memberName,
        memberId: r.memberId,
      });
    }

    return {
      success: true,
      details: {
        occupied,
        blocked: blockedSeats.map(s => ({ seatId: s.seatId, reason: s.reason || undefined })),
      },
    };
  } catch (error) {
    console.error("Error fetching event seat details:", error);
    return { success: false, error: "Failed to fetch seat details" };
  }
}

// ─── Seat Access Tiers ───
export type SeatAccessTierType = "VIP_ONLY" | "MEMBERS_ONLY" | "GENERAL";

export async function getSeatAccessTiers(eventId: string) {
  try {
    const tiers = await prisma.seatAccessTier.findMany({
      where: { eventId },
      select: { seatId: true, tier: true },
    });
    const tierMap: Record<string, SeatAccessTierType> = {};
    for (const t of tiers) {
      tierMap[t.seatId] = t.tier as SeatAccessTierType;
    }
    return { success: true, tiers: tierMap };
  } catch (error) {
    console.error("Error fetching seat access tiers:", error);
    return { success: false, error: "Failed to fetch access tiers" };
  }
}

export async function setSeatAccessTier(eventId: string, seatId: string, tier: SeatAccessTierType) {
  try {
    await requireAdminSession();
    await prisma.seatAccessTier.upsert({
      where: { eventId_seatId: { eventId, seatId } },
      update: { tier },
      create: { eventId, seatId, tier },
    });
    revalidatePath(`/events/${eventId}/seats-control`);
    return { success: true };
  } catch (error) {
    console.error("Error setting seat access tier:", error);
    return { success: false, error: "Failed to set access tier" };
  }
}

export async function bulkSetSeatAccessTiers(eventId: string, seatIds: string[], tier: SeatAccessTierType) {
  try {
    await requireAdminSession();
    await prisma.seatAccessTier.createMany({
      data: seatIds.map(seatId => ({ eventId, seatId, tier })),
      skipDuplicates: true,
    });
    // Update existing entries
    const existing = await prisma.seatAccessTier.findMany({
      where: { eventId, seatId: { in: seatIds }, tier: { not: tier } },
    });
    if (existing.length > 0) {
      await prisma.seatAccessTier.updateMany({
        where: { eventId, seatId: { in: seatIds }, tier: { not: tier } },
        data: { tier },
      });
    }
    revalidatePath(`/events/${eventId}/seats-control`);
    return { success: true, updated: seatIds.length };
  } catch (error) {
    console.error("Error bulk setting seat access tiers:", error);
    return { success: false, error: "Failed to bulk set access tiers" };
  }
}

export async function clearSeatAccessTier(eventId: string, seatId: string) {
  try {
    await requireAdminSession();
    await prisma.seatAccessTier.deleteMany({
      where: { eventId, seatId },
    });
    revalidatePath(`/events/${eventId}/seats-control`);
    return { success: true };
  } catch (error) {
    console.error("Error clearing seat access tier:", error);
    return { success: false, error: "Failed to clear access tier" };
  }
}

export async function getAllMembers() {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        memberId: true,
        name: true,
        phone: true,
        email: true,
        categoryAcronym: true,
        userId: true,
      },
      orderBy: { memberId: "asc" },
    });
    return { success: true, members };
  } catch (error) {
    console.error("Error fetching members:", error);
    return { success: false, error: "Failed to fetch members" };
  }
}

export async function adminCreateBooking(data: {
  eventId: string;
  memberId: number;
  seatIds: string[];
  total: number;
  paymentInfo?: any;
}) {
  try {
    await requireAdminSession();
    const member = await prisma.member.findUnique({
      where: { memberId: data.memberId },
    });
    if (!member) return { success: false, error: "Member not found" };

    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { name: true, date: true },
    });
    if (!event) return { success: false, error: "Event not found" };

    // Ensure these seats are blocked so customers can't book them
    for (const seatId of data.seatIds) {
      await prisma.blockedSeat.upsert({
        where: { eventId_seatId: { eventId: data.eventId, seatId } },
        update: {},
        create: { eventId: data.eventId, seatId, reason: "Admin booking" },
      });
    }

    const attendees = data.seatIds.map((seatId, i) => ({
      seatId,
      price: 0,
      attendeeName: member.name,
      memberId: String(data.memberId),
      isMember: true,
      memberIdVerified: true,
    }));

    const booking = await prisma.booking.create({
      data: {
        userId: member.userId || `admin-${data.memberId}`,
        eventId: data.eventId,
        eventName: event.name,
        eventDate: event.date,
        attendees,
        total: data.total || 0,
        bookingDate: new Date(),
        paymentInfo: data.paymentInfo || { method: "admin", status: "completed", adminBooked: true },
      },
    });

    revalidatePath(`/events/${data.eventId}/seats`);
    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error in admin create booking:", error);
    return { success: false, error: "Failed to create booking" };
  }
}
