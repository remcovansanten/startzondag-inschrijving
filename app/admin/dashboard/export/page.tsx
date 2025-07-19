'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/export');
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `aanmeldingen-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Er is een fout opgetreden bij het exporteren');
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold">Export Aanmeldingen</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Download Aanmeldingen</h2>
          
          <p className="text-gray-600 mb-6">
            Download alle aanmeldingen als Excel bestand. Het bestand bevat alle taken
            met de bijbehorende aanmeldingen, inclusief contactgegevens en opmerkingen.
          </p>
          
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full bg-success text-white py-3 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Bezig met exporteren...' : 'Download Excel'}
          </button>
        </div>
      </div>
    </main>
  );
}