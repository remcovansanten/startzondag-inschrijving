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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
      {taak.categorie && (
        <div className="text-sm text-primary font-semibold mb-2" role="heading" aria-level={4}>{taak.categorie}</div>
      )}
      
      <h3 className="text-xl font-semibold mb-2 text-text-dark">{taak.naam}</h3>
      
      {taak.beschrijving && (
        <p className="text-text-muted mb-4 text-sm">{taak.beschrijving}</p>
      )}
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-dark">{aantalBezet} van {taak.maxAantal} plekken bezet</span>
          <span className="text-text-dark">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isVol ? 'bg-danger' : percentage > 75 ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      
      <Link
        href={isVol ? '#' : `/aanmelden/${taak.id}`}
        className={`block w-full text-center py-2 px-4 rounded font-medium transition-colors ${
          isVol
            ? 'bg-gray-300 text-text-muted cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-hover'
        }`}
        onClick={isVol ? (e) => e.preventDefault() : undefined}
      >
        {isVol ? 'Vol' : 'Aanmelden'}
      </Link>
    </div>
  );
}