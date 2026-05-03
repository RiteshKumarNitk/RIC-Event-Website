"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBooking(data: any) {
  try {
    const booking = await prisma.booking.create({
      data: {
        userId: data.userId,
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: new Date(data.eventDate),
        attendees: data.attendees,
        total: data.total,
        bookingDate: new Date(),
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
    const bookings = await prisma.booking.findMany({
      where: { eventId },
      select: { attendees: true }
    });
    
    // attendees is stored as Json in Prisma. It should be an array.
    const seatIds: string[] = [];
    bookings.forEach(booking => {
      const attendees = booking.attendees as any[];
      if (Array.isArray(attendees)) {
        attendees.forEach(a => {
          if (a.seatId) seatIds.push(a.seatId);
        });
      }
    });
    
    return { success: true, seatIds };
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
    
    const totalUsers = await prisma.user.count();
    
    return { success: true, stats: { totalRevenue, totalUsers } };
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
