'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NieuweTaakPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    naam: '',
    beschrijving: '',
    maxAantal: '',
    categorie: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/taken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxAantal: parseInt(formData.maxAantal)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard"
              className="text-primary hover:underline"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Nieuwe Taak</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-1">
                Naam *
              </label>
              <input
                type="text"
                id="naam"
                name="naam"
                required
                value={formData.naam}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="categorie" className="block text-sm font-medium text-gray-700 mb-1">
                Categorie
              </label>
              <input
                type="text"
                id="categorie"
                name="categorie"
                value={formData.categorie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="beschrijving" className="block text-sm font-medium text-gray-700 mb-1">
                Beschrijving
              </label>
              <textarea
                id="beschrijving"
                name="beschrijving"
                rows={3}
                value={formData.beschrijving}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="maxAantal" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum aantal vrijwilligers *
              </label>
              <input
                type="number"
                id="maxAantal"
                name="maxAantal"
                required
                min="1"
                value={formData.maxAantal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Bezig met opslaan...' : 'Taak toevoegen'}
              </button>
              <Link
                href="/admin/dashboard"
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors text-center"
              >
                Annuleren
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}