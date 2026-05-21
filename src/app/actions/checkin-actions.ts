"use server";

import { prisma } from "@/lib/prisma";

export async function getBookingByQrData(qrData: string) {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(qrData);
    } catch {
      return { success: false, error: "Invalid QR code format." };
    }

    const { bookingId } = parsed;
    if (!bookingId) {
      return { success: false, error: "Invalid QR code: missing booking ID." };
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!booking) {
      return { success: false, error: "Booking not found." };
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { bookingId: booking.id },
      select: { seatId: true, checkedInAt: true },
    });

    const checkedInSeats = new Set(checkIns.map((c) => c.seatId));

    const attendees = (booking.attendees as any[]).map((a) => ({
      ...a,
      checkedIn: checkedInSeats.has(a.seatId),
      checkedInAt: checkIns.find((c) => c.seatId === a.seatId)?.checkedInAt || null,
    }));

    return {
      success: true,
      booking: {
        id: booking.id,
        eventId: booking.eventId,
        eventName: booking.eventName,
        eventDate: booking.eventDate.toISOString(),
        total: booking.total,
        bookingDate: booking.bookingDate.toISOString(),
        user: booking.user,
        attendees,
        allCheckedIn: attendees.every((a: any) => a.checkedIn),
      },
    };
  } catch (error) {
    console.error("Error looking up booking:", error);
    return { success: false, error: "Failed to look up booking." };
  }
}

export async function checkInAttendee(bookingId: string, seatId: string, attendeeName: string, eventId: string, checkedBy?: string) {
  try {
    const existing = await prisma.checkIn.findUnique({
      where: { bookingId_seatId: { bookingId, seatId } },
    });
    if (existing) {
      return { success: true, message: "Already checked in.", checkedInAt: existing.checkedInAt.toISOString() };
    }

    await prisma.checkIn.create({
      data: { bookingId, eventId, seatId, attendeeName, checkedBy },
    });

    return { success: true, message: "Check-in successful." };
  } catch (error) {
    console.error("Error checking in:", error);
    return { success: false, error: "Failed to check in." };
  }
}

export async function checkInAllAttendees(bookingId: string, eventId: string, attendees: { seatId: string; attendeeName: string }[], checkedBy?: string) {
  try {
    const results = await Promise.allSettled(
      attendees.map((a) =>
        prisma.checkIn.upsert({
          where: { bookingId_seatId: { bookingId, seatId: a.seatId } },
          update: {},
          create: { bookingId, eventId, seatId: a.seatId, attendeeName: a.attendeeName, checkedBy },
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    return { success: true, message: `${succeeded} of ${attendees.length} checked in.` };
  } catch (error) {
    console.error("Error checking in all:", error);
    return { success: false, error: "Failed to check in all attendees." };
  }
}

export async function getCheckedInCount(eventId: string) {
  try {
    const count = await prisma.checkIn.count({ where: { eventId } });
    const totalBookings = await prisma.booking.count({ where: { eventId } });
    const totalAttendees = (await prisma.booking.findMany({ where: { eventId }, select: { attendees: true } }))
      .reduce((acc, b) => acc + (Array.isArray(b.attendees) ? b.attendees.length : 0), 0);
    return { success: true, stats: { checkedIn: count, totalBookings, totalAttendees } };
  } catch (error) {
    console.error("Error fetching check-in stats:", error);
    return { success: false, error: "Failed to fetch stats." };
  }
}
