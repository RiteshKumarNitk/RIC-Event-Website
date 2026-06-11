"use server";

import { prisma } from "@/lib/prisma";
import { Member } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdminSession } from "@/lib/server-auth";

const createMemberSchema = z.object({
  memberId: z.number().min(1, "Member ID is required"),
  categoryType: z.string().min(1, "Category type is required"),
  categoryAcronym: z.string().min(1, "Category acronym is required"),
  doa: z.coerce.date(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  dob: z.coerce.date(),
  address: z.string().min(1, "Address is required"),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function getMembers() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { memberId: "asc" }
    });
    return members;
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
}

export async function addMember(data: Omit<Member, "id" | "createdAt" | "updatedAt">) {
  try {
    await requireAdminSession();
    const parsed = createMemberSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }
    const createData: any = { ...parsed.data };
    if (createData.password) {
      createData.password = await bcrypt.hash(createData.password, 12);
    }
    const member = await prisma.member.create({ data: createData });
    return { success: true, member };
  } catch (error: any) {
    console.error("Error creating member:", error);
    return { success: false, error: error.message || "Failed to create member" };
  }
}

export async function updateMember(id: string, data: Partial<Member>) {
  try {
    await requireAdminSession();
    const updateData: any = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }
    const member = await prisma.member.update({
      where: { id },
      data: updateData
    });
    return { success: true, member };
  } catch (error) {
    console.error("Error updating member:", error);
    return { success: false, error: "Failed to update member" };
  }
}

/** @requiresAdmin */
export async function deleteMember(id: string) {
  try {
    await requireAdminSession();
    await prisma.member.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting member:", error);
    return { success: false, error: "Failed to delete member" };
  }
}

/** @requiresAdmin */
export async function seedMembers(sampleMembers: any[]) {
  try {
    await requireAdminSession();
    const existingMembers = await prisma.member.count();
    if (existingMembers > 0) {
      return { success: false, error: "Database already has members" };
    }

    for (const member of sampleMembers) {
      const createData: any = {
        memberId: member.memberId,
        categoryType: member.categoryType,
        categoryAcronym: member.categoryAcronym,
        doa: new Date(member.doa),
        name: member.name,
        phone: member.phone,
        email: member.email,
        dob: new Date(member.dob),
        address: member.address,
        emergencyContact: member.emergencyContact
      };
      if (member.password) {
        createData.password = await bcrypt.hash(member.password, 12);
      }
      await prisma.member.create({ data: createData });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error seeding members:", error);
    return { success: false, error: "Failed to seed members" };
  }
}

/** @requiresAdmin - Destructive action */
export async function deleteAllMembers() {
  try {
    await requireAdminSession();
    await prisma.member.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Error deleting all members:", error);
    return { success: false, error: "Failed to delete all members" };
  }
}
