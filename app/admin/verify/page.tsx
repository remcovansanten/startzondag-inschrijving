'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        router.push('/admin/dashboard');
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Ongeldige of verlopen link');
    } catch {
      setError('Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full border border-gray-100 text-center">
      <img src="/logo-gke.png" alt="Gereformeerde Kerk Ermelo" className="h-16 w-auto mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-text-dark mb-4">Inloggen</h1>

      {!token ? (
        <p className="text-red-700">Geen geldig token in de link.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">Klik om je aanmelding te bevestigen en in te loggen.</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <Suspense fallback={<p>Laden…</p>}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}
