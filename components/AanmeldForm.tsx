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
  // Tijdstip waarop het formulier verscheen (voor de anti-bot tijd-check).
  const [renderedAt] = useState(() => Date.now());
  // Honeypot: blijft leeg bij echte gebruikers; bots vullen 'm.
  const [website, setWebsite] = useState('');

  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    opmerking: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/aanmelden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taakId, ...formData, website, renderedAt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Er is een fout opgetreden');
      }

      const target = data.wijzigToken
        ? `/bevestiging?token=${encodeURIComponent(data.wijzigToken)}`
        : '/bevestiging';
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — verborgen voor mensen, zichtbaar voor bots. Niet aankomen. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="website">Vul dit veld niet in</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

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
          placeholder="06-12345678"
          pattern="^(06[\s-]?\d{8}|0[1-578][0-9][\s-]?\d{7})$"
          title="Voer een geldig Nederlands telefoonnummer in"
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

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="akkoord"
          name="akkoord"
          required
          className="mt-1 h-4 w-4"
        />
        <label htmlFor="akkoord" className="text-sm text-gray-600">
          Ik ga ermee akkoord dat mijn naam, e-mail en telefoonnummer worden gebruikt voor de
          organisatie van de Startzondag. Deze gegevens worden na afloop verwijderd.
        </label>
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
