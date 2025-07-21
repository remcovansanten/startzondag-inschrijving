'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AanmeldFormProps {
  taakId: string;
  taakNaam: string;
}

export default function AanmeldForm({ taakId, taakNaam }: AanmeldFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    opmerking: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/aanmelden', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taakId,
          ...formData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }

      router.push('/bevestiging');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="naam" className="block text-sm font-medium text-text-dark mb-1">
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
        <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1">
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
        <label htmlFor="telefoon" className="block text-sm font-medium text-text-dark mb-1">
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
        <label htmlFor="opmerking" className="block text-sm font-medium text-text-dark mb-1">
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
        <div className="bg-danger-bg border border-red-200 text-danger px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? 'Bezig met aanmelden...' : 'Aanmelden'}
      </button>
    </form>
  );
}