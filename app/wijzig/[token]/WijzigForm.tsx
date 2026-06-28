'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WijzigFormProps {
  aanmelding: {
    id: string;
    token: string;
    naam: string;
    email: string;
    telefoon: string;
    opmerking: string | null;
    taak: {
      naam: string;
    };
  };
}

export default function WijzigForm({ aanmelding }: WijzigFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [formData, setFormData] = useState({
    naam: aanmelding.naam,
    email: aanmelding.email,
    telefoon: aanmelding.telefoon,
    opmerking: aanmelding.opmerking || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/wijzig/${aanmelding.token}`, {
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

      alert('Je gegevens zijn succesvol bijgewerkt!');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/wijzig/${aanmelding.token}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }

      alert('Je aanmelding is succesvol geannuleerd!');
      router.push('/');
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
    <>
      <form onSubmit={handleUpdate} className="space-y-4 mb-6">
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="telefoon" className="block text-sm font-medium text-gray-700 mb-1">
            Telefoon *
          </label>
          <input
            type="tel"
            id="telefoon"
            name="telefoon"
            required
            value={formData.telefoon}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="opmerking" className="block text-sm font-medium text-gray-700 mb-1">
            Opmerking (optioneel)
          </label>
          <textarea
            id="opmerking"
            name="opmerking"
            rows={3}
            value={formData.opmerking}
            onChange={handleChange}
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
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Bezig met opslaan...' : 'Wijzigingen opslaan'}
        </button>
      </form>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Aanmelding annuleren</h3>
        
        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            disabled={loading}
            className="w-full bg-danger text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Aanmelding annuleren
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Weet je zeker dat je je aanmelding voor &quot;{aanmelding.taak.naam}&quot; wilt annuleren?
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-danger text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Bezig met annuleren...' : 'Ja, annuleer'}
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Nee, behouden
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}