'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  naam: string;
  categorie: string | null;
  maxAantal: number;
  _count: { aanmeldingen: number };
}

interface TaskSearchProps {
  tasks: Task[];
}

export default function TaskSearch({ tasks }: TaskSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique categories
  const categories = Array.from(
    new Set(tasks.map(t => t.categorie).filter(Boolean))
  ).sort();

  // Filter tasks based on search and category
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.naam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Zoek taken..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">Alle categorieën</option>
          {categories.map(cat => (
            <option key={cat} value={cat!}>{cat}</option>
          ))}
        </select>
      </div>

      {searchTerm || selectedCategory !== 'all' ? (
        <div className="mb-4 text-sm text-gray-600">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'taak' : 'taken'} gevonden
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Naam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bezetting
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map((taak) => {
              const percentage = (taak._count.aanmeldingen / taak.maxAantal) * 100;
              const isVol = taak._count.aanmeldingen >= taak.maxAantal;

              return (
                <tr key={taak.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {taak.naam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {taak.categorie || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">
                        {taak._count.aanmeldingen}/{taak.maxAantal}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isVol ? 'bg-danger' : percentage > 75 ? 'bg-warning' : 'bg-success'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isVol
                        ? 'bg-danger-bg text-danger'
                        : percentage > 75
                        ? 'bg-warning-bg text-warning'
                        : 'bg-success-bg text-success'
                    }`}>
                      {isVol ? 'Vol' : percentage > 75 ? 'Bijna vol' : 'Open'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/dashboard/taken/${taak.id}`}
                      className="text-primary hover:text-primary-hover hover:underline mr-3 font-medium"
                    >
                      Bekijk
                    </Link>
                    <Link
                      href={`/admin/dashboard/taken/${taak.id}/edit`}
                      className="text-primary hover:text-primary-hover hover:underline font-medium"
                    >
                      Bewerk
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            {searchTerm || selectedCategory !== 'all' ? 'Geen taken gevonden' : 'Nog geen taken aangemaakt'}
          </div>
        )}
      </div>
    </div>
  );
}
