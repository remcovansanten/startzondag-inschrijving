'use client';

import Link from 'next/link';

interface TaakCardProps {
  taak: {
    id: string;
    naam: string;
    beschrijving: string | null;
    maxAantal: number;
    categorie: string | null;
    _count: {
      aanmeldingen: number;
    };
  };
}

export default function TaakCard({ taak }: TaakCardProps) {
  const aantalBezet = taak._count.aanmeldingen;
  const percentage = (aantalBezet / taak.maxAantal) * 100;
  const isVol = aantalBezet >= taak.maxAantal;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {taak.categorie && (
        <div className="text-sm text-secondary mb-2">{taak.categorie}</div>
      )}
      
      <h3 className="text-xl font-semibold mb-2">{taak.naam}</h3>
      
      {taak.beschrijving && (
        <p className="text-gray-600 mb-4">{taak.beschrijving}</p>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{aantalBezet} van {taak.maxAantal} plekken bezet</span>
          <span>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isVol ? 'bg-danger' : percentage > 75 ? 'bg-warning' : 'bg-success'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      
      <Link
        href={isVol ? '#' : `/aanmelden/${taak.id}`}
        className={`block w-full text-center py-2 px-4 rounded-md font-medium transition-colors ${
          isVol
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-blue-600'
        }`}
        onClick={isVol ? (e) => e.preventDefault() : undefined}
      >
        {isVol ? 'Vol' : 'Aanmelden'}
      </Link>
    </div>
  );
}