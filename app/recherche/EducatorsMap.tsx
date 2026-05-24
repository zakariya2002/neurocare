'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PROFESSION_LABELS } from '@/components/annonces/types';
import { getProfessionByValue } from '@/lib/professions-config';

interface EducatorPin {
  id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  latitude: number;
  longitude: number;
  profession_type: string | null;
  hourly_rate: number | null;
  avatar_url: string | null;
  rating: number | null;
  total_reviews: number | null;
}

function createMarkerIcon() {
  // Couleurs charte NeuroCare (teal + accent rose)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#027e7e" stroke="white" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="5" fill="white"/>
    <circle cx="14" cy="13" r="2.5" fill="#f0879f"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 40;
  let bg = '#027e7e';
  if (count > 50) {
    size = 56;
    bg = '#065959';
  } else if (count > 20) {
    size = 48;
    bg = '#016969';
  }
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};color:white;
      border-radius:50%;border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${count > 99 ? 12 : 14}px;
      box-shadow:0 4px 12px rgba(2,126,126,0.35);
    ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapBoundsUpdater({ items }: { items: EducatorPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (items.length === 0) {
      map.setView([46.6, 2.3], 6);
      return;
    }
    if (items.length === 1) {
      map.setView([items[0].latitude, items[0].longitude], 11);
      return;
    }
    const bounds = L.latLngBounds(items.map((i) => [i.latitude, i.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [items, map]);
  return null;
}

function professionLabel(p: string | null): string {
  if (!p) return 'Professionnel';
  return PROFESSION_LABELS[p] || getProfessionByValue(p)?.label || p;
}

export default function EducatorsMap() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<EducatorPin[]>([]);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/educators/geocoded')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setRemaining(data.remainingToBackfill || 0);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markers = useMemo(() => items, [items]);

  if (!ready || loading) {
    return (
      <div className="w-full rounded-xl bg-gray-100 flex items-center justify-center" style={{ height: 380 }}>
        <p className="text-gray-400 text-sm">Chargement de la carte des professionnels…</p>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="w-full rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-center px-4" style={{ height: 380 }}>
        <p className="text-gray-500 text-sm">Aucun professionnel géolocalisé pour le moment.</p>
        {remaining > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {remaining} fiche{remaining > 1 ? 's' : ''} en cours de géocodage… rafraîchissez dans quelques secondes.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative" style={{ height: 380, zIndex: 0 }}>
      <MapContainer
        center={[46.6, 2.3]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater items={markers} />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {markers.map((m) => (
            <Marker key={m.id} position={[m.latitude, m.longitude]} icon={createMarkerIcon()}>
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    {m.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.avatar_url}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #027e7e',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(2,126,126,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#027e7e',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {(m.first_name?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
                        {m.first_name} {m.last_name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                        {professionLabel(m.profession_type)}
                      </p>
                    </div>
                  </div>

                  {m.location && (
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280' }}>📍 {m.location}</p>
                  )}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, marginBottom: 8 }}>
                    {m.hourly_rate && (
                      <span style={{ color: '#027e7e', fontWeight: 600 }}>{m.hourly_rate} €/h</span>
                    )}
                    {typeof m.rating === 'number' && m.rating > 0 && (
                      <span style={{ color: '#b9456d', fontWeight: 600 }}>
                        ★ {m.rating.toFixed(1)}
                        {m.total_reviews ? ` (${m.total_reviews})` : ''}
                      </span>
                    )}
                  </div>

                  <a
                    href={`/professionnel/${m.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: '#027e7e',
                      color: 'white',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Voir le profil →
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
