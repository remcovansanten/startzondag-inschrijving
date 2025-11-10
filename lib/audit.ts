import { prisma } from '@/lib/db';

export type AuditAction =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'DELETE_REGISTRATION'
  | 'EXPORT_DATA'
  | 'BULK_UPLOAD';

export async function createAuditLog({
  adminId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  adminId: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entity,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break operations
  }
}
