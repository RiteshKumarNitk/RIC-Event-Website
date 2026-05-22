import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

const getSecret = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-key-for-dev");

export async function POST(req: Request) {
  try {
    const { memberId, password } = await req.json();
    if (!memberId || !password) {
      return NextResponse.json({ error: "Member ID and password are required" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { memberId: parseInt(memberId) },
    });

    if (!member || !member.password) {
      return NextResponse.json({ error: "Invalid Member ID or password" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, member.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Member ID or password" }, { status: 401 });
    }

    const token = await new SignJWT({
      memberId: member.memberId,
      memberName: member.name,
      memberEmail: member.email,
      memberCategory: member.categoryType,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set("member-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

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
  } catch (error) {
    console.error("Member login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
