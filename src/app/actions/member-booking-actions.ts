"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { sendBookingConfirmation } from "./email-actions";

/**
 * Creates a booking for an authenticated member (reads member-token JWT cookie).
 * Members get free tickets — all attendees are marked as members with ₹0 price.
 * Supports multiple seats per booking. Members can book again for the same event
 * (only the duplicate seat-level check applies, not per-event).
 */
export async function createMemberBooking(
  eventId: string,
  seatIds: string[],
  showtime?: string
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  try {
    // 1. Authenticate via member-token cookie
    const currentMember = await getCurrentMember();
    if (!currentMember) {
      return { success: false, error: "You must be logged in as a member to book." };
    }

    // 2. Look up the full member record from DB
    const member = await prisma.member.findUnique({
      where: { memberId: currentMember.memberId },
      select: {
        id: true,
        memberId: true,
        name: true,
        email: true,
        userId: true,
      },
    });

    if (!member) {
      return { success: false, error: "Member record not found." };
    }

    // 3. Ensure we have a website User record linked to this member
    let userId = member.userId;
    if (!userId) {
      const newUser = await prisma.user.create({
        data: {
          name: member.name,
          email: member.email,
          role: "USER",
        },
      });
      userId = newUser.id;
      await prisma.member.update({
        where: { id: member.id },
        data: { userId: newUser.id },
      });
    }

    // 4. Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true, venue: true, image: true },
    });

    if (!event) {
      return { success: false, error: "Event not found." };
    }

    // 5. Check that none of the requested seats are already booked
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

    // ─── Multi-seat support: removed per-event duplicate check ───
    // Members can book multiple seats per event (the seat-level check above
    // prevents double-booking the same seat).

    // 6. Acquire seat locks to prevent race conditions
    const lockExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.$transaction(
      seatIds.map((seatId) =>
        prisma.seatLock.upsert({
          where: { eventId_seatId: { eventId, seatId } },
          update: { userId: userId as string, expiresAt: lockExpiry },
          create: { eventId, seatId, userId: userId as string, expiresAt: lockExpiry },
        })
      )
    );

    // 7. Build attendees — all are member tickets (free)
    const attendees = seatIds.map((seatId, index) => ({
      seatId,
      price: 0,
      attendeeName: index === 0 ? member.name : `${member.name} (Guest)`,
      memberId: String(member.memberId),
      isMember: index === 0,
      memberIdVerified: true,
    }));

    // 8. Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        attendees: attendees as any,
        total: 0,
        bookingDate: new Date(),
        paymentInfo: {
          method: "member-benefit",
          status: "completed",
          memberId: member.memberId,
          memberName: member.name,
        },
      },
    });

    // 9. Release the locks
    await prisma.seatLock.deleteMany({
      where: { eventId, seatId: { in: seatIds } },
    });

    // 10. Send email confirmation
    if (member.email) {
      sendBookingConfirmation({
        email: member.email,
        name: member.name,
        bookingId: booking.id,
        eventName: event.name,
        eventDate: event.date.toISOString(),
        eventVenue: (event as any).venue || "RIC Jaipur",
        attendees: attendees.map((a) => ({
          name: a.attendeeName,
          seat: a.seatId,
          price: 0,
        })),
        total: 0,
        qrData: JSON.stringify({
          bookingId: booking.id,
          eventName: event.name,
          user: member.email,
          seats: seatIds.join(", "),
        }),
      }).catch((err) => {
        console.error("Failed to send email confirmation:", err);
      });
    }

    // 11. Revalidate paths
    revalidatePath(`/events/${eventId}/seats`);
    revalidatePath(`/member/events/${eventId}`);

    return { success: true, bookingId: booking.id };
  } catch (error) {
    console.error("Error creating member booking:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}


