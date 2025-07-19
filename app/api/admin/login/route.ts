import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createToken, setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Gebruikersnaam en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    // For initial setup, create admin if it doesn't exist
    let admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin && username === process.env.ADMIN_USERNAME) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'change-this-password', 10);
      admin = await prisma.admin.create({
        data: {
          username,
          passwordHash: hashedPassword
        }
      });
    }

    if (!admin) {
      return NextResponse.json(
        { message: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }

    const token = await createToken({ id: admin.id, username: admin.username });
    await setSession(token);

    return NextResponse.json({
      success: true,
      message: 'Succesvol ingelogd'
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het inloggen' },
      { status: 500 }
    );
  }
}