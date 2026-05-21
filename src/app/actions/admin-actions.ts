"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function seedDefaultAdmin() {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "admin@ric.com" },
    });
    if (existing) {
      if (existing.role !== "ADMIN") {
        await prisma.user.update({
          where: { email: "admin@ric.com" },
          data: { role: "ADMIN" },
        });
        return { success: true, message: "Existing user promoted to ADMIN." };
      }
      return { success: true, message: "Admin account already exists." };
    }

    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        email: "admin@ric.com",
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    return { success: true, message: "Default admin created (admin@ric.com / admin123)." };
  } catch (error) {
    console.error("Error seeding admin:", error);
    return { success: false, error: "Failed to seed admin." };
  }
}
