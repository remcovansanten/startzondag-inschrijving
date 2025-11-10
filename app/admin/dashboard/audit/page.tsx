import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type AuditLogWithAdmin = {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  admin: {
    username: string;
  };
};

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const logs: AuditLogWithAdmin[] = await prisma.auditLog.findMany({
    include: {
      admin: {
        select: { username: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Last 100 entries
  });

  return (
    <main className="min-h-screen bg-bg-light">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard"
              className="text-primary hover:underline"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-text-dark">Audit Log</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-text-dark">Recent Admin Acties (laatste 100)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.createdAt).toLocaleString('nl-NL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.admin.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.action.includes('DELETE')
                          ? 'bg-red-100 text-red-800'
                          : log.action.includes('CREATE')
                          ? 'bg-green-100 text-green-800'
                          : log.action.includes('UPDATE')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.entity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-primary hover:underline">View details</summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="text-center py-8 text-text-muted">
                Nog geen audit logs
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
