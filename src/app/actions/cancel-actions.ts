"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cancelBooking(bookingId: string, userId: string) {
  try {
    if (!bookingId || !userId) {
      return { success: false, error: "Missing booking ID or user ID." };
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { success: false, error: "Booking not found." };

    // Verify ownership
    if (booking.userId !== userId) {
      return { success: false, error: "Unauthorized: you can only cancel your own bookings." };
    }

    // Delete check-ins first, then the booking
    await prisma.checkIn.deleteMany({ where: { bookingId } });
    await prisma.booking.delete({ where: { id: bookingId } });

    revalidatePath(`/events/${booking.eventId}/seats`);
    return { success: true, message: "Booking cancelled successfully." };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return { success: false, error: "Failed to cancel booking." };
  }
}
