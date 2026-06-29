import Link from 'next/link';

export default async function BevestigingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const wijzigLink = token ? `${siteUrl}/wijzig/${token}` : null;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Aanmelding geslaagd!</h1>
        </div>

        <p className="text-gray-600 mb-6">
          Je aanmelding is succesvol verwerkt. Je ontvangt binnen enkele minuten een
          bevestigingsmail met alle details.
        </p>

        {wijzigLink && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              Wil je je aanmelding wijzigen of annuleren? Dat kan via deze link
              (deze staat ook in je bevestigingsmail):
            </p>
            <a href={wijzigLink} className="text-primary text-sm break-all hover:underline">
              {wijzigLink}
            </a>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Terug naar overzicht
          </Link>
        </div>
      </div>
    </main>
  );
}
