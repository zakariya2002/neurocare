'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Veuillez entrer votre adresse email.');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Vous avez été désabonné avec succès. Vous ne recevrez plus nos emails.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Une erreur est survenue.');
      }
    } catch {
      setStatus('error');
      setMessage('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {status === 'success' ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Désabonnement confirmé</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <Link
                href="/"
                className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📧</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Se désabonner</h1>
                <p className="text-gray-600">
                  Entrez votre email pour vous désabonner de la newsletter NeuroCare.
                </p>
              </div>

              <form onSubmit={handleUnsubscribe} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? 'Désabonnement...' : 'Se désabonner'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Vous pouvez aussi nous contacter à{' '}
                <a href="mailto:contact@neuro-care.fr" className="text-teal-600 hover:underline">
                  contact@neuro-care.fr
                </a>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2025 NeuroCare - Tous droits réservés
        </p>
      </div>
    </div>
  );
}
