'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  taakId: string;
  taakNaam: string;
  aanmeldingenCount: number;
}

export default function DeleteButton({ taakId, taakNaam, aanmeldingenCount }: DeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/taken/${taakId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Taak verwijderen?</h3>
          <p className="text-gray-600 mb-6">
            Weet je zeker dat je de taak &quot;{taakNaam}&quot; wilt verwijderen?
            {aanmeldingenCount > 0 && (
              <span className="block mt-2 text-red-600 font-medium">
                Let op: Deze taak heeft {aanmeldingenCount} aanmelding{aanmeldingenCount !== 1 ? 'en' : ''} die eerst verwijderd moeten worden.
              </span>
            )}
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors font-medium"
            >
              Annuleren
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || aanmeldingenCount > 0}
              className="flex-1 bg-danger text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Bezig...' : 'Verwijderen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="bg-danger text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium text-sm"
    >
      Verwijderen
    </button>
  );
}