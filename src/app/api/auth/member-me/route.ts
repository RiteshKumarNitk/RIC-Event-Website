import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMember } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentMember = await getCurrentMember();
    if (!currentMember) {
      return NextResponse.json({ member: null });
    }

    const member = await prisma.member.findUnique({
      where: { memberId: currentMember.memberId },
    });

    if (!member) {
      return NextResponse.json({ member: null });
    }

    return NextResponse.json({
      member: {
        id: member.id,
        memberId: member.memberId,
        name: member.name,
        phone: member.phone,
        email: member.email,
        categoryType: member.categoryType,
        categoryAcronym: member.categoryAcronym,
      },
    });
  } catch {
    return NextResponse.json({ member: null });
  }
}
