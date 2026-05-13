import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Force reload after prisma.ts update
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export async function POST(req: Request) {
  console.log('[SIGNUP_ROUTE] DATABASE_URL present:', !!process.env.DATABASE_URL);
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json({ message: "Request body is empty" }, { status: 400 });
    }
    const body = JSON.parse(text);
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists', code: 'auth/email-already-in-use' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[SIGNUP_ERROR]', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'User with this email already exists', code: 'auth/email-already-in-use' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || 'Internal Server Error', code: 'auth/signup-failed' },
      { status: 500 }
    );
  }
}
