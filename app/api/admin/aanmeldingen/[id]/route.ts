import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { getSession } from '@/lib/auth';

// DELETE a registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if registration exists
    const aanmelding = await prisma.aanmelding.findUnique({
      where: { id },
      include: {
        taak: {
          select: { naam: true }
        }
      }
    });

    if (!aanmelding) {
      return NextResponse.json(
        { message: 'Aanmelding niet gevonden' },
        { status: 404 }
      );
    }

    // Audit log before deletion
    const session = await getSession();
    if (session && typeof session === 'object' && 'id' in session) {
      await createAuditLog({
        adminId: session.id as string,
        action: 'DELETE_REGISTRATION',
        entity: 'Aanmelding',
        entityId: id,
        details: {
          naam: aanmelding.naam,
          email: aanmelding.email,
          taak: aanmelding.taak.naam
        },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    // Delete the registration
    await prisma.aanmelding.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Aanmelding succesvol verwijderd'
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het verwijderen van de aanmelding' },
      { status: 500 }
    );
  }
}