"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateRICMainHallLayout, calculateTotalSeats } from "@/lib/default-hall-layout";

export async function getHalls() {
  try {
    const halls = await prisma.hall.findMany({
      orderBy: { name: 'asc' }
    });
    return { success: true, halls };
  } catch (error) {
    console.error("Error fetching halls:", error);
    return { success: false, error: "Failed to fetch halls" };
  }
}

export async function getHall(id: string) {
  try {
    const hall = await prisma.hall.findUnique({ where: { id } });
    return { success: true, hall };
  } catch (error) {
    console.error("Error fetching hall:", error);
    return { success: false, error: "Failed to fetch hall" };
  }
}

export async function createHall(data: { name: string; description: string }) {
  try {
    // Always auto-generate RIC Main Hall layout by default
    const sections = generateRICMainHallLayout();
    const totalSeats = calculateTotalSeats(sections);

    const hall = await prisma.hall.create({
      data: {
        name: data.name,
        description: data.description,
        sections: sections as any,
        totalSeats: totalSeats,
      }
    });
    revalidatePath("/admin/halls");
    return { success: true, hallId: hall.id };
  } catch (error) {
    console.error("Error creating hall:", error);
    return { success: false, error: "Failed to create hall" };
  }
}

export async function saveHallLayout(id: string, layout: { sections: any[]; totalSeats: number }) {
  try {
    await prisma.hall.update({
      where: { id },
      data: {
        sections: layout.sections as any,
        totalSeats: layout.totalSeats,
      }
    });
    revalidatePath("/admin/halls");
    return { success: true };
  } catch (error) {
    console.error("Error saving hall layout:", error);
    return { success: false, error: "Failed to save layout" };
  }
}

export async function deleteHall(id: string) {
  try {
    await prisma.hall.delete({ where: { id } });
    revalidatePath("/admin/halls");
    return { success: true };
  } catch (error) {
    console.error("Error deleting hall:", error);
    return { success: false, error: "Failed to delete hall" };
  }
}
