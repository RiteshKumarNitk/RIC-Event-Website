"use server";

import { prisma } from "@/lib/prisma";
import { Member } from "@prisma/client";

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
    const member = await prisma.member.create({
      data
    });
    return { success: true, member };
  } catch (error) {
    console.error("Error creating member:", error);
    return { success: false, error: "Failed to create member" };
  }
}

export async function updateMember(id: string, data: Partial<Member>) {
  try {
    const member = await prisma.member.update({
      where: { id },
      data
    });
    return { success: true, member };
  } catch (error) {
    console.error("Error updating member:", error);
    return { success: false, error: "Failed to update member" };
  }
}

export async function deleteMember(id: string) {
  try {
    await prisma.member.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Error deleting member:", error);
    return { success: false, error: "Failed to delete member" };
  }
}

export async function seedMembers(sampleMembers: any[]) {
  try {
    const existingMembers = await prisma.member.count();
    if (existingMembers > 0) {
      return { success: false, error: "Database already has members" };
    }

    for (const member of sampleMembers) {
      await prisma.member.create({
        data: {
          applicationId: member.applicationId,
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
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error seeding members:", error);
    return { success: false, error: "Failed to seed members" };
  }
}

export async function deleteAllMembers() {
  try {
    await prisma.member.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Error deleting all members:", error);
    return { success: false, error: "Failed to delete all members" };
  }
}
