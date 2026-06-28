'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-6">
          <img src="/logo-gke.png" alt="Gereformeerde Kerk Ermelo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-dark">Admin login</h1>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-center">
            <p className="font-medium">Check je e-mail</p>
            <p className="text-sm mt-1">
              Als dit adres een beheerder is, hebben we een inloglink gestuurd. De link is 15 minuten geldig.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">
              Vul je e-mailadres in. Je ontvangt een eenmalige inloglink — geen wachtwoord nodig.
            </p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mailadres
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Bezig...' : 'Stuur inloglink'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
