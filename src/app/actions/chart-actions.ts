"use server";

import { prisma } from "@/lib/prisma";

export type MonthlyBookingData = {
  month: string; // "Jan", "Feb", etc.
  year: number;
  bookings: number;
  revenue: number;
  freeSeats: number; // Member free tickets
  paidSeats: number; // Regular paid tickets
};

export async function getBookingsChartData(): Promise<{ success: boolean; data?: MonthlyBookingData[]; error?: string }> {
  try {
    // Get all bookings with their attendees
    const bookings = await prisma.booking.findMany({
      select: {
        bookingDate: true,
        total: true,
        attendees: true,
      },
      orderBy: { bookingDate: "asc" },
    });

    // Group by year-month
    const monthlyMap = new Map<string, { bookings: number; revenue: number; freeSeats: number; paidSeats: number }>();

    for (const booking of bookings) {
      const date = new Date(booking.bookingDate);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { bookings: 0, revenue: 0, freeSeats: 0, paidSeats: 0 });
      }

      const entry = monthlyMap.get(key)!;
      entry.bookings += 1;
      entry.revenue += booking.total;

      // Count free vs paid seats from attendees
      const attendees = booking.attendees as any[];
      if (Array.isArray(attendees)) {
        for (const a of attendees) {
          if (a.isMember || a.price === 0) {
            entry.freeSeats += 1;
          } else {
            entry.paidSeats += 1;
          }
        }
      }
    }

    // Convert to sorted array (last 12 months)
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const now = new Date();
    const result: MonthlyBookingData[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = months[d.getMonth()];
      const year = d.getFullYear();

      const entry = monthlyMap.get(key) || { bookings: 0, revenue: 0, freeSeats: 0, paidSeats: 0 };

      result.push({
        month: monthLabel,
        year,
        bookings: entry.bookings,
        revenue: entry.revenue,
        freeSeats: entry.freeSeats,
        paidSeats: entry.paidSeats,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return { success: false, error: "Failed to fetch chart data." };
  }
}
