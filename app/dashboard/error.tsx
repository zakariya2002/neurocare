'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-gray-600 mb-6">
          Impossible de charger le tableau de bord. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
