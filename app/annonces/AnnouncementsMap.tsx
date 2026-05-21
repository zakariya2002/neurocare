'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ACCOMPANIMENT_TYPE_LABELS,
  TND_CONTEXT_LABELS,
  PLACE_TYPE_LABELS,
  GENDER_LABELS_PERSON,
  START_FLEX_LABELS,
  AccompanimentType,
  TndContext,
  PlaceType,
  GenderPreference,
  StartFlexibility,
} from '@/components/annonces/types';

interface AnnouncementPin {
  id: string;
  title: string;
  city: string | null;
  latitude: number;
  longitude: number;
  accompaniment_types: string[];
  tnd_context: string[];
  place_types: string[];
  hours_per_week: number | null;
  person_age: number | null;
  gender_preference: GenderPreference | null;
  start_date: string | null;
  start_date_flexibility: StartFlexibility | null;
  published_at: string | null;
  created_at: string | null;
}

// Marker rose (couleur "famille") — distinct des pros (teal).
function createMarkerIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#f0879f" stroke="white" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="5" fill="white"/>
    <circle cx="14" cy="13" r="2.5" fill="#027e7e"/>
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
  let bg = '#f0879f';
  if (count > 50) {
    size = 56;
    bg = '#d95a7c';
  } else if (count > 20) {
    size = 48;
    bg = '#e36b8c';
  }
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};color:white;
      border-radius:50%;border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${count > 99 ? 12 : 14}px;
      box-shadow:0 4px 12px rgba(240,135,159,0.4);
    ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapBoundsUpdater({ items }: { items: AnnouncementPin[] }) {
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

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 24) return `il y a ${diffHrs} h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `il y a ${diffDays} j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function AnnouncementsMap() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AnnouncementPin[]>([]);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/announcements/geocoded')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
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
        <p className="text-gray-400 text-sm">Chargement de la carte des annonces…</p>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="w-full rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-center px-4" style={{ height: 380 }}>
        <p className="text-gray-500 text-sm">Aucune annonce géolocalisée pour le moment.</p>
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
          {markers.map((m) => {
            const tags = [
              ...(m.accompaniment_types || []).slice(0, 2).map((t) => ACCOMPANIMENT_TYPE_LABELS[t as AccompanimentType] || t),
              ...(m.tnd_context || []).slice(0, 2).map((t) => TND_CONTEXT_LABELS[t as TndContext] || t),
            ];
            const placeLabel = (m.place_types || [])
              .map((p) => PLACE_TYPE_LABELS[p as PlaceType] || p)
              .join(', ');
            const startLabel = m.start_date
              ? new Date(m.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
              : m.start_date_flexibility
                ? START_FLEX_LABELS[m.start_date_flexibility]
                : null;
            const genderLabel = m.gender_preference && m.gender_preference !== 'any'
              ? GENDER_LABELS_PERSON[m.gender_preference]
              : null;

            return (
              <Marker key={m.id} position={[m.latitude, m.longitude]} icon={createMarkerIcon()}>
                <Popup>
                  <div style={{ minWidth: 220, maxWidth: 260 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1f2937', lineHeight: 1.3 }}>
                      {m.title}
                    </p>
                    {m.city && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
                        📍 {m.city} · {formatRelativeDate(m.published_at || m.created_at)}
                      </p>
                    )}

                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0' }}>
                        {tags.map((t, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: 'rgba(2,126,126,0.08)',
                              color: '#027e7e',
                              fontWeight: 600,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, lineHeight: 1.6 }}>
                      {placeLabel && <div>🏢 {placeLabel}</div>}
                      {startLabel && <div>📅 {startLabel}</div>}
                      {genderLabel && <div>👤 {genderLabel}</div>}
                      {typeof m.hours_per_week === 'number' && m.hours_per_week > 0 && (
                        <div>⏱ {m.hours_per_week} h / sem</div>
                      )}
                      {typeof m.person_age === 'number' && <div>🎂 {m.person_age} ans</div>}
                    </div>

                    <a
                      href={`/annonces/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        padding: '6px 12px',
                        backgroundColor: '#027e7e',
                        color: 'white',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Voir l'annonce →
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
