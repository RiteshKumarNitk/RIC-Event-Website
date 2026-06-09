import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const token = await requireAdmin(req as any);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, newPassword } = await req.json();
    if (!memberId || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.member.update({
      where: { memberId: parseInt(memberId) },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting member password:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
