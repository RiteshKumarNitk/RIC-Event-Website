import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getSecret = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key-for-dev");

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("member-token")?.value;
    if (!token) {
      return NextResponse.json({ member: null });
    }

    const { payload } = await jwtVerify(token, getSecret());
    const memberId = payload.memberId as number;

    const member = await prisma.member.findUnique({
      where: { memberId },
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
