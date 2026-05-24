'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function CommunityError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Une erreur est survenue</h2>
        <p className="text-gray-600 mb-6">Impossible de charger la communauté. Veuillez réessayer.</p>
        <button onClick={reset} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">
          Réessayer
        </button>
      </div>
    </div>
  );
}
