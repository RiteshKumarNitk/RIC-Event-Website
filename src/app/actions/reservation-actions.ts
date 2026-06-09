"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Zod Schemas ---
const createReservationSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  seatId: z.string().min(1, "Seat ID is required"),
  memberId: z.number().min(1, "Member ID is required"),
  memberName: z.string().min(1, "Member name is required"),
  guestCount: z.number().min(0).max(10, "Guest count must be between 0 and 10"),
});

// Reservation TTL: 30 minutes
const RESERVATION_TTL_MS = 30 * 60 * 1000;

/**
 * Create a seat reservation for a member.
 * Only verified members can reserve seats in member-exclusive sections.
 */
export async function createReservation(data: {
  eventId: string;
  seatId: string;
  memberId: number;
  memberName: string;
  guestCount?: number;
}) {
  try {
    const parsed = createReservationSchema.safeParse({
      ...data,
      guestCount: data.guestCount ?? 0,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }
    const { eventId, seatId, memberId, memberName, guestCount } = parsed.data;

    // 1. Clean up expired reservations
    await prisma.seatReservation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // 2. Check if seat is already booked or blocked (single query for both)
    const [existingBookings, blockedSeat] = await Promise.all([
      prisma.booking.findMany({
        where: { eventId },
        select: { attendees: true },
      }),
      prisma.blockedSeat.findUnique({
        where: { eventId_seatId: { eventId, seatId } },
      }),
    ]);

    if (blockedSeat) {
      return { success: false, error: "This seat is currently unavailable." };
    }

    for (const booking of existingBookings) {
      const attendees = booking.attendees as any[];
      if (Array.isArray(attendees)) {
        if (attendees.some((a) => a.seatId === seatId)) {
          return { success: false, error: "This seat is already booked." };
        }
      }
    }

    // 3. Create the reservation (unique constraint catches race conditions)
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
    try {
      const reservation = await prisma.seatReservation.create({
        data: {
          eventId,
          seatId,
          memberId,
          memberName,
          guestCount,
          status: "RESERVED",
          expiresAt,
        },
      });

      revalidatePath(`/events/${eventId}/seats`);
      return { success: true, reservationId: reservation.id, expiresAt };
    } catch (error: any) {
      // Catch Prisma unique constraint violation (P2002) for race conditions
      if (error?.code === "P2002") {
        return { success: false, error: "This seat was just reserved by another member. Please try a different seat." };
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating reservation:", error);
    return { success: false, error: "Failed to create reservation" };
  }
}

/**
 * Cancel a seat reservation.
 */
export async function cancelReservation(reservationId: string, memberId: number) {
  try {
    if (!reservationId || typeof reservationId !== "string") {
      return { success: false, error: "Invalid reservation ID" };
    }

    const reservation = await prisma.seatReservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }
    if (reservation.memberId !== memberId) {
      return { success: false, error: "You can only cancel your own reservations" };
    }

    await prisma.seatReservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });

    revalidatePath(`/events/${reservation.eventId}/seats`);
    return { success: true };
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return { success: false, error: "Failed to cancel reservation" };
  }
}

/**
 * Get all active (non-cancelled, non-expired) reservations for an event.
 * Returns seat IDs that are reserved.
 */
export async function getReservedSeats(eventId: string) {
  try {
    if (!eventId || typeof eventId !== "string") {
      return { success: false, error: "Invalid event ID" };
    }

    // Clean up expired reservations first
    await prisma.seatReservation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const reservations = await prisma.seatReservation.findMany({
      where: {
        eventId,
        status: { in: ["RESERVED", "CONFIRMED"] },
      },
      select: {
        seatId: true,
        memberId: true,
        memberName: true,
        guestCount: true,
        status: true,
      },
    });

    return {
      success: true,
      reservations,
      seatIds: reservations.map((r) => r.seatId),
    };
  } catch (error) {
    console.error("Error fetching reserved seats:", error);
    return { success: false, error: "Failed to fetch reserved seats" };
  }
}

/**
 * Get all reservations for a specific member across all events.
 */
export async function getMemberReservations(memberId: number) {
  try {
    const reservations = await prisma.seatReservation.findMany({
      where: { memberId },
      include: { event: { select: { id: true, name: true, date: true, venue: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, reservations };
  } catch (error) {
    console.error("Error fetching member reservations:", error);
    return { success: false, error: "Failed to fetch reservations" };
  }
}

/**
 * Confirm a reservation (convert RESERVED → CONFIRMED).
 * Called when payment is completed or admin confirms.
 */
export async function confirmReservation(reservationId: string) {
  try {
    const reservation = await prisma.seatReservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }
    if (reservation.expiresAt < new Date()) {
      return { success: false, error: "Reservation has expired" };
    }
    if (reservation.status === "CANCELLED") {
      return { success: false, error: "Reservation was cancelled" };
    }

    await prisma.seatReservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
    });

    revalidatePath(`/events/${reservation.eventId}/seats`);
    return { success: true };
  } catch (error) {
    console.error("Error confirming reservation:", error);
    return { success: false, error: "Failed to confirm reservation" };
  }
}

// ─── Admin Actions ───

/**
 * Get all reservations across all events (admin view).
 */
export async function getAllReservations(filters?: { eventId?: string; status?: string }) {
  try {
    // Clean up expired reservations first
    await prisma.seatReservation.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const where: any = {};
    if (filters?.eventId) where.eventId = filters.eventId;
    if (filters?.status) where.status = filters.status;

    const reservations = await prisma.seatReservation.findMany({
      where,
      include: {
        event: { select: { id: true, name: true, date: true, venue: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, reservations };
  } catch (error) {
    console.error("Error fetching all reservations:", error);
    return { success: false, error: "Failed to fetch reservations" };
  }
}

/**
 * Admin cancel a reservation (no member check required).
 */
export async function adminCancelReservation(reservationId: string) {
  try {
    const reservation = await prisma.seatReservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }

    await prisma.seatReservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });

    revalidatePath(`/events/${reservation.eventId}/seats`);
    revalidatePath("/admin/reservations");
    return { success: true };
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return { success: false, error: "Failed to cancel reservation" };
  }
}

/**
 * Admin confirm a reservation (no member check required).
 */
export async function adminConfirmReservation(reservationId: string) {
  try {
    const reservation = await prisma.seatReservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) {
      return { success: false, error: "Reservation not found" };
    }
    if (reservation.status === "CANCELLED") {
      return { success: false, error: "Reservation was cancelled" };
    }

    await prisma.seatReservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
    });

    revalidatePath(`/events/${reservation.eventId}/seats`);
    revalidatePath("/admin/reservations");
    return { success: true };
  } catch (error) {
    console.error("Error confirming reservation:", error);
    return { success: false, error: "Failed to confirm reservation" };
  }
}
