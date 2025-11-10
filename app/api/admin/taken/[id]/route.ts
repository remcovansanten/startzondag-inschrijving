import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { getSession } from '@/lib/auth';

// GET a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const taak = await prisma.taak.findUnique({
      where: { id },
      include: {
        _count: {
          select: { aanmeldingen: true }
        }
      }
    });

    if (!taak) {
      return NextResponse.json(
        { message: 'Taak niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json(taak);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

// PUT (update) a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { naam, beschrijving, maxAantal, categorie } = body;

    if (!naam || !maxAantal) {
      return NextResponse.json(
        { message: 'Naam en maximum aantal zijn verplicht' },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await prisma.taak.findUnique({
      where: { id },
      include: {
        _count: {
          select: { aanmeldingen: true }
        }
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Taak niet gevonden' },
        { status: 404 }
      );
    }

    // Check if new maxAantal is less than current registrations
    if (parseInt(maxAantal) < existingTask._count.aanmeldingen) {
      return NextResponse.json(
        { message: `Maximum aantal kan niet lager zijn dan het huidige aantal aanmeldingen (${existingTask._count.aanmeldingen})` },
        { status: 400 }
      );
    }

    const updatedTaak = await prisma.taak.update({
      where: { id },
      data: {
        naam,
        beschrijving: beschrijving || null,
        maxAantal: parseInt(maxAantal),
        categorie: categorie || null,
      },
    });

    // Audit log
    const session = await getSession();
    if (session && typeof session === 'object' && 'id' in session) {
      await createAuditLog({
        adminId: session.id as string,
        action: 'UPDATE_TASK',
        entity: 'Taak',
        entityId: updatedTaak.id,
        details: {
          naam: updatedTaak.naam,
          maxAantal: updatedTaak.maxAantal,
          categorie: updatedTaak.categorie,
          changes: {
            naam: existingTask.naam !== naam,
            maxAantal: existingTask.maxAantal !== parseInt(maxAantal),
            categorie: existingTask.categorie !== categorie
          }
        },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      taak: updatedTaak
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het bijwerken van de taak' },
      { status: 500 }
    );
  }
}

// DELETE a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if task exists and has registrations
    const task = await prisma.taak.findUnique({
      where: { id },
      include: {
        _count: {
          select: { aanmeldingen: true }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Taak niet gevonden' },
        { status: 404 }
      );
    }

    if (task._count.aanmeldingen > 0) {
      return NextResponse.json(
        { message: `Deze taak kan niet worden verwijderd omdat er ${task._count.aanmeldingen} aanmeldingen zijn. Verwijder eerst alle aanmeldingen.` },
        { status: 400 }
      );
    }

    // Audit log before deletion
    const session = await getSession();
    if (session && typeof session === 'object' && 'id' in session) {
      await createAuditLog({
        adminId: session.id as string,
        action: 'DELETE_TASK',
        entity: 'Taak',
        entityId: id,
        details: { naam: task.naam, categorie: task.categorie },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    // Delete the task
    await prisma.taak.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Taak succesvol verwijderd'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Er is een fout opgetreden bij het verwijderen van de taak' },
      { status: 500 }
    );
  }
}