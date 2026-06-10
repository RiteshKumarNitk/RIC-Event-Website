"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RIC_AUDITORIUM } from "@/lib/seat-layouts";
import { z } from "zod";

// Extract member-only seat block prefixes from the auditorium layout
const MEMBER_ONLY_PREFIXES: string[] = RIC_AUDITORIUM.blocks
  .filter(b => b.membersOnly && b.id)
  .map(b => b.id + "-");

function isMemberOnlySeat(seatId: string): boolean {
  return MEMBER_ONLY_PREFIXES.some(p => seatId.startsWith(p));
}

// --- Zod Schemas ---
const attendeeSchema = z.object({
  seatId: z.string().min(1, "Seat ID is required"),
  price: z.number().min(0),
  attendeeName: z.string().min(1, "Attendee name is required"),
  memberId: z.string().optional(),
  isMember: z.boolean().default(false),
  memberIdVerified: z.boolean().default(false),
});

const createBookingSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  eventName: z.string().min(1, "Event name is required"),
  eventDate: z.string().min(1, "Event date is required"),
  attendees: z.array(attendeeSchema).min(1, "At least one attendee is required"),
  total: z.number().min(0, "Total must be non-negative"),
  paymentInfo: z.any().optional(),
});

// Seat lock TTL in milliseconds (10 minutes)
const SEAT_LOCK_TTL_MS = 10 * 60 * 1000;

export async function createBooking(data: any) {
  try {
    // Zod validation
    const parsed = createBookingSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }
    const validated = parsed.data;
    const { userId, eventId, attendees } = validated;

    // Server-side validation: if any attendee has a member-only seat, verify user has linked member
    const hasMemberOnlySeat = attendees.some((a) => a.seatId && isMemberOnlySeat(a.seatId));
    if (hasMemberOnlySeat) {
      // Check for member-only seat attendees that are NOT already verified via checkout flow
      const unverifiedMemberOnlySeats = attendees.filter(
        (a) => a.seatId && isMemberOnlySeat(a.seatId) && !(a.isMember && a.memberIdVerified)
      );
      if (unverifiedMemberOnlySeats.length > 0) {
        const linkedMember = await prisma.member.findUnique({
          where: { userId },
          select: { id: true, memberId: true, name: true },
        });
        if (!linkedMember) {
          return { success: false, error: "You must be a verified RIC member to book member-exclusive seats." };
        }
        for (const attendee of unverifiedMemberOnlySeats) {
          attendee.isMember = true;
          attendee.memberIdVerified = true;
          attendee.memberId = String(linkedMember.memberId);
          attendee.attendeeName = attendee.attendeeName || linkedMember.name;
        }
      }
    }

    // --- Atomic seat lock check ---
    // 1. Clean up expired locks
    await prisma.seatLock.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // 2. Check if any requested seats are already locked by another user
    const seatIds = attendees.map((a) => a.seatId);
    const existingLocks = await prisma.seatLock.findMany({
      where: {
        eventId,
        seatId: { in: seatIds },
        userId: { not: userId }, // Ignore own locks
      },
      select: { seatId: true },
    });

    if (existingLocks.length > 0) {
      return {
        success: false,
        error: `Seats ${existingLocks.map(l => l.seatId).join(", ")} are currently being booked by another user. Please try again in a moment.`,
      };
    }

    // 3. Check if seats are already booked
    const existingBookings = await prisma.booking.findMany({
      where: { eventId },
      select: { attendees: true },
    });
    const bookedSeatIds = new Set<string>();
    for (const booking of existingBookings) {
      const atts = booking.attendees as any[];
      if (Array.isArray(atts)) {
        for (const a of atts) {
          if (a.seatId) bookedSeatIds.add(a.seatId);
        }
      }
    }
    const alreadyBooked = seatIds.filter((id) => bookedSeatIds.has(id));
    if (alreadyBooked.length > 0) {
      return {
        success: false,
        error: `Seats ${alreadyBooked.join(", ")} are already booked. Please select different seats.`,
      };
    }

    // 3.5 Check SeatReservations
    const reservations = await prisma.seatReservation.findMany({
      where: { eventId, seatId: { in: seatIds }, status: { in: ["RESERVED", "CONFIRMED"] } }
    });
    
    if (reservations.length > 0) {
      for (const res of reservations) {
        const matchingAttendee = attendees.find((a: any) => a.seatId === res.seatId);
        if (!matchingAttendee || !matchingAttendee.isMember || String(matchingAttendee.memberId) !== String(res.memberId)) {
           return { success: false, error: `Seat ${res.seatId} is reserved for another member.` };
        }
      }
    }

    // 4. Acquire locks for the seats (upsert to handle re-tries)
    const lockExpiry = new Date(Date.now() + SEAT_LOCK_TTL_MS);
    await prisma.$transaction(
      seatIds.map((seatId) =>
        prisma.seatLock.upsert({
          where: { eventId_seatId: { eventId, seatId } },
          update: { userId, expiresAt: lockExpiry },
          create: { eventId, seatId, userId, expiresAt: lockExpiry },
        })
      )
    );

    // 5. Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId,
        eventName: validated.eventName,
        eventDate: new Date(validated.eventDate),
        attendees: validated.attendees as any,
        total: validated.total,
        bookingDate: new Date(),
        paymentInfo: (validated.paymentInfo as any) || null,
      },
    });

    // 6. Release the locks (seats are now in the booking)
    await prisma.seatLock.deleteMany({
      where: { eventId, seatId: { in: seatIds } },
    });
    
    // Revalidate the seating page so the new booked seats show up immediately
    revalidatePath(`/events/${eventId}/seats`);
    
    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

export async function getBookedSeats(eventId: string) {
  try {
    const [bookings, blockedSeats, reservations] = await Promise.all([
      prisma.booking.findMany({
        where: { eventId },
        select: { attendees: true }
      }),
      prisma.blockedSeat.findMany({
        where: { eventId },
        select: { seatId: true }
      }),
      prisma.seatReservation.findMany({
        where: {
          eventId,
          status: { in: ["RESERVED", "CONFIRMED"] },
        },
        select: { seatId: true, memberId: true, memberName: true },
      }),
    ]);
    
    const seatIds = new Set<string>();
    const reservedMap = new Map<string, { memberId: number; memberName: string }>();
    
    // Add all booked seats
    bookings.forEach(booking => {
      const attendees = booking.attendees as any[];
      if (Array.isArray(attendees)) {
        attendees.forEach(a => {
          if (a.seatId) seatIds.add(a.seatId);
        });
      }
    });
    
    // Add all admin-blocked seats
    blockedSeats.forEach(bs => seatIds.add(bs.seatId));
    
    // Add all reserved seats (shown as unavailable to non-members, but available to the reserving member)
    reservations.forEach(r => {
      reservedMap.set(r.seatId, { memberId: r.memberId, memberName: r.memberName });
    });
    
    return {
      success: true,
      seatIds: Array.from(seatIds),
      reservedSeats: Object.fromEntries(reservedMap),
    };
  } catch (error) {
    console.error("Error fetching booked seats:", error);
    return { success: false, error: "Failed to fetch booked seats" };
  }
}

export async function getUserBookings(userId: string) {
  try {
    // Input validation
    if (!userId || typeof userId !== "string") {
      return { success: false, error: "Invalid user ID" };
    }
    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { bookingDate: "desc" }
    });
    
    return { success: true, bookings };
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return { success: false, error: "Failed to fetch user bookings" };
  }
}

export async function getEventBookings(eventId: string) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { bookingDate: "desc" }
    });
    
    return { success: true, bookings };
  } catch (error) {
    console.error("Error fetching event bookings:", error);
    return { success: false, error: "Failed to fetch event bookings" };
  }
}

export async function getAdminStats() {
  try {
    const bookings = await prisma.booking.findMany({
      select: { total: true }
    });
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.total, 0);
    const totalBookings = await prisma.booking.count();
    const totalUsers = await prisma.user.count();
    
    return { success: true, stats: { totalRevenue, totalUsers, totalBookings } };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return { success: false, error: "Failed to fetch admin stats" };
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
    return { success: true, users };
  } catch (error) {
    console.error("Error fetching all users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}
