import { NextRequest, NextResponse } from 'next/server';
import { assertAuth } from '@/lib/assert-admin';

export async function POST(request: NextRequest) {
  try {
    // Seuls les utilisateurs authentifies peuvent creer des salles video
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    const { appointmentId, roomName: customRoomName } = await request.json();

    // Générer un nom de room unique
    const roomName = customRoomName || `apt-${appointmentId?.substring(0, 8) || 'test'}-${Date.now()}`;

    // Créer la room via l'API Daily.co
    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public', // public pour le prototype, private nécessite des tokens
        properties: {
          // La room expire dans 24h
          exp: Math.floor(Date.now() / 1000) + 86400,
          // Activer l'enregistrement si besoin (désactivé par défaut)
          enable_recording: false,
          // Activer le chat
          enable_chat: true,
          // Permettre aux participants de partager leur écran
          enable_screenshare: true,
          // Limiter à 4 participants
          max_participants: 4,
          // Auto-join activé
          start_audio_off: false,
          start_video_off: false,
          // Langue française
          lang: 'fr',
        },
      }),
    });

    if (!dailyResponse.ok) {
      const errorData = await dailyResponse.json();
      console.error('Daily.co API error:', errorData);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la room', details: errorData },
        { status: 500 }
      );
    }

    const roomData = await dailyResponse.json();

    return NextResponse.json({
      success: true,
      roomUrl: roomData.url,
      roomName: roomData.name,
    });

  } catch (error) {
    console.error('Erreur création room:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// GET: Récupérer les rooms existantes
export async function GET(request: NextRequest) {
  try {
    // Seuls les utilisateurs authentifies peuvent lister les rooms
    const { user, error: authError } = await assertAuth();
    if (authError) return authError;

    // Lister les rooms via l'API Daily.co
    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      },
    });

    if (!dailyResponse.ok) {
      const errorData = await dailyResponse.json();
      return NextResponse.json(
        { error: 'Erreur Daily.co', details: errorData },
        { status: 500 }
      );
    }

    const roomsData = await dailyResponse.json();

    return NextResponse.json({
      success: true,
      rooms: roomsData.data || [],
    });

  } catch (error) {
    console.error('Erreur récupération rooms:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
