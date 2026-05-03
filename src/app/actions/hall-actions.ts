"use server";

import { prisma } from "@/lib/prisma";

export async function getHallForEvent(hallId: string) {
  try {
    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { id: true, name: true, sections: true, totalSeats: true }
    });
    if (!hall) return { success: false, error: "Hall not found" };
    return { success: true, hall };
  } catch (error) {
    console.error("Error fetching hall:", error);
    return { success: false, error: "Failed to fetch hall" };
  }
}

export async function getAllHalls() {
  try {
    const halls = await prisma.hall.findMany({
      select: { id: true, name: true, description: true, totalSeats: true }
    });
    return { success: true, halls };
  } catch (error) {
    console.error("Error fetching halls:", error);
    return { success: false, error: "Failed to fetch halls" };
  }
}
