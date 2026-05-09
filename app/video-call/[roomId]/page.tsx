'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function VideoCallPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer pour la durée de l'appel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isJoined && callStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isJoined, callStartTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const joinCall = useCallback(async () => {
    if (isCreatingRoom || roomUrl) return;

    setIsCreatingRoom(true);
    setError(null);

    try {
      // 1) Créer (ou récupérer) la room privée
      const createResp = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: roomId }),
      });
      const createData = await createResp.json();
      if (!createResp.ok) {
        throw new Error(createData.error || 'Erreur lors de la création de la room');
      }

      // 2) Demander un meeting token signé côté serveur
      const tokenResp = await fetch('/api/video/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: roomId }),
      });
      const tokenData = await tokenResp.json();
      if (!tokenResp.ok) {
        const minutes = tokenData.minutesUntilOpen;
        if (typeof minutes === 'number') {
          throw new Error(`La séance ouvre dans ${minutes} minute${minutes > 1 ? 's' : ''}.`);
        }
        throw new Error(tokenData.error || 'Erreur de génération du jeton de session');
      }

      // 3) Construire l'URL avec le token (room privée Daily.co)
      const baseUrl = tokenData.roomUrl || createData.roomUrl;
      const urlWithToken = `${baseUrl}?t=${encodeURIComponent(tokenData.token)}`;

      setRoomUrl(urlWithToken);
      setIsJoined(true);
      setCallStartTime(new Date());

    } catch (err: any) {
      console.error('Erreur joinCall:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [roomId, isCreatingRoom, roomUrl]);

  const leaveCall = useCallback(() => {
    setIsJoined(false);
    setRoomUrl(null);
    setCallStartTime(null);
    setElapsedTime(0);
  }, []);

  const openInNewTab = useCallback(() => {
    if (roomUrl) {
      window.open(roomUrl, '_blank');
    }
  }, [roomUrl]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fdf9f4' }}>
      {/* Navbar style dashboard */}
      <nav className="sticky top-0 z-40" style={{ backgroundColor: '#41005c' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20 items-center relative">
            {/* Bouton retour à gauche */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/dashboard/educator/appointments')}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                aria-label="Retour aux rendez-vous"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline font-medium">Retour</span>
              </button>
            </div>

            {/* Logo centré */}
            <Link href="/dashboard/educator" className="absolute left-1/2 transform -translate-x-1/2" aria-label="Retour au tableau de bord">
              <div className="flex items-center gap-2">
                <img
                  src="/images/logo-neurocare.svg"
                  alt="NeuroCare"
                  className="h-20"
                />
                <span className="px-2 py-0.5 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#f0879f' }}>
                  PRO
                </span>
              </div>
            </Link>

            {/* Actions à droite */}
            <div className="flex items-center gap-2 sm:gap-4">
              {isJoined && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-white/20 text-white rounded-full text-xs sm:text-sm font-medium">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    <span className="hidden sm:inline">En direct</span>
                  </span>
                  <span className="text-white/90 text-sm font-mono bg-white/10 px-2 py-1 rounded">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              )}

              {isJoined && roomUrl && (
                <button
                  onClick={openInNewTab}
                  className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}

              {isJoined && (
                <button
                  onClick={leaveCall}
                  className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  <span className="hidden sm:inline">Quitter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Video Container */}
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto h-full">
          {!isJoined && !isCreatingRoom ? (
            <div className="h-full flex flex-col items-center justify-center min-h-[70vh]">
              <div className="bg-white rounded-2xl p-8 sm:p-10 text-center max-w-md shadow-xl border border-gray-100">
                {/* Icône vidéo */}
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ backgroundColor: '#41005c' }}>
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#41005c' }}>
                  Prêt pour la séance ?
                </h2>
                <p className="text-gray-500 mb-8">
                  Séance: <span className="font-mono font-semibold" style={{ color: '#41005c' }}>{roomId.substring(0, 8)}...</span>
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={joinCall}
                  disabled={isCreatingRoom}
                  className="w-full py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:opacity-90 shadow-lg text-lg"
                  style={{ backgroundColor: '#41005c' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Rejoindre la séance vidéo
                </button>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-500 text-sm mb-4">Vérifiez avant de rejoindre :</p>
                  <div className="flex justify-center gap-6">
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f7f7' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#05a5a5' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Caméra
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f7f7' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#05a5a5' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Micro
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f7f7' }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#05a5a5' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      Connexion
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* État de chargement */}
          {isCreatingRoom && !isJoined && (
            <div className="h-full flex flex-col items-center justify-center min-h-[70vh]">
              <div className="bg-white rounded-2xl p-8 sm:p-10 text-center max-w-md shadow-xl border border-gray-100">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ backgroundColor: '#41005c' }}>
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ color: '#41005c' }}>
                  Préparation de la salle...
                </h2>
                <p className="text-gray-500">
                  Veuillez patienter quelques instants
                </p>
              </div>
            </div>
          )}

          {/* Iframe Daily.co */}
          {isJoined && roomUrl && (
            <div className="w-full h-[calc(100vh-140px)] rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <iframe
                src={roomUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title="Séance vidéo Daily.co"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
