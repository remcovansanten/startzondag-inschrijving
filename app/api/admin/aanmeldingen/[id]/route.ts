import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { STATUS } from '@/lib/aanmelding';

// DELETE a registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;

    // Check if registration exists
    const aanmelding = await prisma.aanmelding.findUnique({
      where: { id }
    });

    if (!aanmelding) {
      return NextResponse.json(
        { message: 'Aanmelding niet gevonden' },
        { status: 404 }
      );
    }

    // Soft-delete: markeer als geannuleerd (rij blijft bewaard voor rapportage).
    await prisma.aanmelding.update({
      where: { id },
      data: { status: STATUS.GEANNULEERD },
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