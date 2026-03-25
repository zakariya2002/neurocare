'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Structure {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  code_postal: string;
  ville: string;
  telephone: string | null;
  lat: number | null;
  lng: number | null;
}

const TYPE_COLORS: Record<string, string> = {
  CMP: '#1e40af',
  CAMSP: '#065f46',
  SESSAD: '#5b21b6',
  CMPP: '#92400e',
  CRA: '#9d174d',
  Handiconsult: '#0369a1',
  PCO: '#854d0e',
  Handident: '#be123c',
};

function createIcon(type: string) {
  const color = TYPE_COLORS[type] || '#027e7e';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });
}

// Style des clusters
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 36;
  let bg = '#027e7e';
  if (count > 50) { size = 48; bg = '#065f46'; }
  else if (count > 20) { size = 42; bg = '#0e7490'; }

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};color:white;
      border-radius:50%;border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${count > 99 ? 11 : 13}px;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapUpdater({ structures }: { structures: Structure[] }) {
  const map = useMap();

  useEffect(() => {
    const withCoords = structures.filter(s => s.lat && s.lng);
    if (withCoords.length === 0) {
      map.setView([46.6, 2.3], 6);
      return;
    }
    if (withCoords.length === 1) {
      map.setView([withCoords[0].lat!, withCoords[0].lng!], 12);
    } else {
      const bounds = L.latLngBounds(withCoords.map(s => [s.lat!, s.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [structures, map]);

  return null;
}

export default function StructuresMap({ structures }: { structures: Structure[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  const markers = useMemo(() => {
    return structures.filter(s => s.lat && s.lng);
  }, [structures]);

  if (!ready) {
    return (
      <div className="w-full rounded-xl bg-gray-100 flex items-center justify-center" style={{ height: 420 }}>
        <p className="text-gray-400 text-sm">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative" style={{ height: 420, zIndex: 0 }}>
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
        <MapUpdater structures={markers} />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {markers.map(s => (
            <Marker
              key={s.id}
              position={[s.lat!, s.lng!]}
              icon={createIcon(s.type)}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{s.nom}</p>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: '#6b7280' }}>
                    {s.adresse && `${s.adresse}, `}{s.code_postal} {s.ville}
                  </p>
                  {s.telephone && (
                    <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                      <a href={`tel:${s.telephone.replace(/\s/g, '')}`} style={{ color: '#027e7e', fontWeight: 600 }}>
                        {s.telephone}
                      </a>
                    </p>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.adresse} ${s.code_postal} ${s.ville}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#027e7e', fontWeight: 600 }}
                  >
                    Itin&eacute;raire &rarr;
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
