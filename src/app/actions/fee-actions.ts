"use server";

import { prisma } from "@/lib/prisma";

export async function getFeeConfig() {
  try {
    const config = await prisma.feeConfig.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });
    return {
      success: true,
      config: config || { gstPercentage: 0, platformFeeType: "FLAT", platformFeeValue: 0 },
    };
  } catch (error) {
    console.error("Error fetching fee config:", error);
    return { success: false, error: "Failed to fetch fee config" };
  }
}

export async function upsertFeeConfig(data: {
  gstPercentage: number;
  platformFeeType: "PERCENTAGE" | "FLAT";
  platformFeeValue: number;
}) {
  try {
    const existing = await prisma.feeConfig.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.feeConfig.update({
        where: { id: existing.id },
        data: {
          gstPercentage: data.gstPercentage,
          platformFeeType: data.platformFeeType,
          platformFeeValue: data.platformFeeValue,
        },
      });
    } else {
      await prisma.feeConfig.create({
        data: {
          gstPercentage: data.gstPercentage,
          platformFeeType: data.platformFeeType,
          platformFeeValue: data.platformFeeValue,
          active: true,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving fee config:", error);
    return { success: false, error: "Failed to save fee config" };
  }
}

export async function calculateFees(subtotal: number) {
  try {
    const config = await prisma.feeConfig.findFirst({
      where: { active: true },
      orderBy: { updatedAt: "desc" },
    });

    const gstPct = config?.gstPercentage ?? 18;
    const feeType = config?.platformFeeType ?? "FLAT";
    const feeVal = config?.platformFeeValue ?? 0;

    const gst = Math.round(subtotal * (gstPct / 100) * 100) / 100;
    const platformFee = feeType === "PERCENTAGE"
      ? Math.round(subtotal * (feeVal / 100) * 100) / 100
      : feeVal;

    return {
      success: true,
      breakdown: {
        subtotal,
        gstPercentage: gstPct,
        gst,
        platformFeeType: feeType,
        platformFeeValue: feeVal,
        platformFee,
        total: subtotal + gst + platformFee,
      },
    };
  } catch (error) {
    console.error("Error calculating fees:", error);
    return { success: false, error: "Failed to calculate fees" };
  }
}
