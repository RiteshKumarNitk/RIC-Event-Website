"use server";

import { prisma } from "@/lib/prisma";

export async function getAllTransactions(filters?: {
  eventId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}) {
  try {
    const where: any = {};
    if (filters?.eventId) where.eventId = filters.eventId;
    if (filters?.paymentMethod) where.paymentInfo = { path: ["method"], equals: filters.paymentMethod };
    if (filters?.paymentStatus) where.paymentInfo = { ...where.paymentInfo, path: ["status"], equals: filters.paymentStatus };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { name: true } },
      },
      orderBy: { bookingDate: "desc" },
    });

    const transactions = bookings.map((b) => {
      const paymentInfo = b.paymentInfo as any || {};
      const attendees = b.attendees as any[];
      return {
        id: b.id,
        eventName: b.eventName,
        eventId: b.eventId,
        userName: b.user?.name || "Guest",
        userEmail: b.user?.email,
        total: b.total,
        bookingDate: b.bookingDate.toISOString(),
        method: paymentInfo.method || "N/A",
        upiTransactionId: paymentInfo.upiTransactionId || null,
        upiRefNo: paymentInfo.upiRefNo || null,
        status: paymentInfo.status || "completed",
        attendeeCount: attendees.length,
      };
    });

    return { success: true, transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Failed to fetch transactions." };
  }
}

export async function getTransactionStats() {
  try {
    const bookings = await prisma.booking.findMany({
      select: { total: true, paymentInfo: true },
    });

    const stats = {
      totalRevenue: bookings.reduce((acc, b) => acc + b.total, 0),
      totalBookings: bookings.length,
      byMethod: {} as Record<string, { count: number; revenue: number }>,
      byStatus: {} as Record<string, { count: number }>,
    };

    for (const b of bookings) {
      const info = (b.paymentInfo as any) || {};
      const method = info.method || "unknown";
      const status = info.status || "completed";

      if (!stats.byMethod[method]) stats.byMethod[method] = { count: 0, revenue: 0 };
      stats.byMethod[method].count++;
      stats.byMethod[method].revenue += b.total;

      if (!stats.byStatus[status]) stats.byStatus[status] = { count: 0 };
      stats.byStatus[status].count++;
    }

    return { success: true, stats };
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return { success: false, error: "Failed to fetch stats." };
  }
}
