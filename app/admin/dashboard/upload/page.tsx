'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replaceAll, setReplaceAll] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecteer een bestand');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replaceAll', replaceAll.toString());

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setError(data.message + '\n\n' + data.errors.join('\n'));
        } else {
          setError(data.message || 'Er is een fout opgetreden');
        }
        return;
      }

      setResult(data);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (err) {
      setError('Er is een fout opgetreden bij het uploaden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-primary hover:underline mb-6"
        >
          ← Terug naar dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Excel Upload</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-semibold text-blue-900 mb-2">Excel Template</h2>
            <p className="text-blue-800 mb-2">
              Upload een Excel (.xlsx) of CSV bestand met de volgende kolommen:
            </p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li><strong>Naam</strong> - Naam van de taak (verplicht)</li>
              <li><strong>Beschrijving</strong> - Beschrijving van de taak (optioneel)</li>
              <li><strong>MaxAantal</strong> - Maximum aantal vrijwilligers (verplicht, getal)</li>
              <li><strong>Categorie</strong> - Categorie van de taak (optioneel)</li>
            </ul>
          </div>

          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-semibold mb-2">Voorbeeld:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Naam</th>
                    <th className="text-left p-2">Beschrijving</th>
                    <th className="text-left p-2">MaxAantal</th>
                    <th className="text-left p-2">Categorie</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Opbouw tent</td>
                    <td className="p-2">Help met opbouwen</td>
                    <td className="p-2">10</td>
                    <td className="p-2">Opbouw</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Catering</td>
                    <td className="p-2">Eten serveren</td>
                    <td className="p-2">8</td>
                    <td className="p-2">Catering</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bestand selecteren
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-600"
                required
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Vervang alle bestaande taken (dit verwijdert ook alle aanmeldingen!)
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded whitespace-pre-line">
                {error}
              </div>
            )}

            {result && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Uploaden...' : 'Upload Taken'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/template-taken.xlsx"
              download
              className="text-primary hover:underline text-sm"
            >
              Download voorbeeld template
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}