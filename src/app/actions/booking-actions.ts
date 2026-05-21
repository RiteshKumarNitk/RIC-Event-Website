"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RIC_AUDITORIUM } from "@/lib/seat-layouts";

// Extract member-only seat block prefixes from the auditorium layout
const MEMBER_ONLY_PREFIXES: string[] = RIC_AUDITORIUM.blocks
  .filter(b => b.membersOnly && b.id)
  .map(b => b.id + "-");

function isMemberOnlySeat(seatId: string): boolean {
  return MEMBER_ONLY_PREFIXES.some(p => seatId.startsWith(p));
}

export async function createBooking(data: any) {
  try {
    const userId = data.userId;

    // Server-side validation: if any attendee has a member-only seat, verify user has linked member
    if (data.attendees && Array.isArray(data.attendees)) {
      const hasMemberOnlySeat = data.attendees.some((a: any) => a.seatId && isMemberOnlySeat(a.seatId));
      if (hasMemberOnlySeat && userId) {
        const linkedMember = await prisma.member.findUnique({
          where: { userId },
          select: { id: true, memberId: true, name: true },
        });
        if (!linkedMember) {
          return { success: false, error: "You must be a verified RIC member to book member-exclusive seats." };
        }
        // Auto-fill member info for each member-only seat attendee
        data.attendees = data.attendees.map((a: any) => {
          if (a.seatId && isMemberOnlySeat(a.seatId)) {
            return {
              ...a,
              isMember: true,
              memberIdVerified: true,
              memberId: String(linkedMember.memberId),
              attendeeName: a.attendeeName || linkedMember.name,
            };
          }
          return a;
        });
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: new Date(data.eventDate),
        attendees: data.attendees,
        total: data.total,
        bookingDate: new Date(),
        paymentInfo: data.paymentInfo || null,
      }
    });
    
    // Revalidate the seating page so the new booked seats show up immediately
    revalidatePath(`/events/${data.eventId}/seats`);
    
    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error creating booking:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

export async function getBookedSeats(eventId: string) {
  try {
    const [bookings, blockedSeats] = await Promise.all([
      prisma.booking.findMany({
        where: { eventId },
        select: { attendees: true }
      }),
      prisma.blockedSeat.findMany({
        where: { eventId },
        select: { seatId: true }
      }),
    ]);
    
    const seatIds = new Set<string>();
    
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
    
    return { success: true, seatIds: Array.from(seatIds) };
  } catch (error) {
    console.error("Error fetching booked seats:", error);
    return { success: false, error: "Failed to fetch booked seats" };
  }
}

export async function getUserBookings(userId: string) {
  try {
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
