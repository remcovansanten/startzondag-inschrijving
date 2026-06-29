import { prisma } from './db';

// Leg een beheeractie vast. Mag de hoofdactie nooit laten falen.
export async function logAudit(params: {
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail: params.actorEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        details: params.details ?? null,
      },
    });
  } catch {
    console.error('Audit-log kon niet geschreven worden');
  }
}
