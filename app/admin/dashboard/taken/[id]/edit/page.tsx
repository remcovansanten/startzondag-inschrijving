'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditTaakPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingTask, setLoadingTask] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    naam: '',
    beschrijving: '',
    maxAantal: '',
    categorie: ''
  });

  useEffect(() => {
    const loadTask = async () => {
      const { id } = await params;
      setTaskId(id);
      
      try {
        const response = await fetch(`/api/admin/taken/${id}`);
        if (!response.ok) throw new Error('Taak niet gevonden');
        
        const task = await response.json();
        setFormData({
          naam: task.naam,
          beschrijving: task.beschrijving || '',
          maxAantal: task.maxAantal.toString(),
          categorie: task.categorie || ''
        });
      } catch (err) {
        setError('Fout bij het laden van de taak');
      } finally {
        setLoadingTask(false);
      }
    };
    
    loadTask();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/taken/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }

      setSuccess('Taak succesvol bijgewerkt!');
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 1500);
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

  if (loadingTask) {
    return (
      <main className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Laden...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-primary hover:underline mb-6"
        >
          ← Terug naar dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
          <h1 className="text-2xl font-bold mb-6">Taak Bewerken</h1>
          
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Bezig met opslaan...' : 'Wijzigingen Opslaan'}
              </button>
              <Link
                href="/admin/dashboard"
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors font-medium text-center"
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