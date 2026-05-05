'use client';

import React from 'react';

type Size = 'sm' | 'md' | 'lg' | 'fullscreen';

interface Props {
  size?: Size;
  message?: string;
  messageClassName?: string;
}

export default function NeuroLoaderEEG({
  size = 'md',
  message,
  messageClassName,
}: Props) {
  const isFullscreen = size === 'fullscreen';
  const resolvedMessage = message ?? 'Chargement…';
  const glyphPx =
    size === 'sm' ? 64 : size === 'md' ? 112 : size === 'lg' ? 160 : 180;

  const glyph = (
    <div
      className="neuro-eeg-glyph"
      style={{ width: glyphPx, height: glyphPx * 0.72 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 180 130"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="eeg-brain-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#027e7e" />
            <stop offset="100%" stopColor="#41005c" />
          </linearGradient>
          <linearGradient id="eeg-wave-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#027e7e" stopOpacity="0" />
            <stop offset="20%" stopColor="#027e7e" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#41005c" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#41005c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cerveau compact en haut */}
        <g
          className="eeg-brain"
          stroke="url(#eeg-brain-stroke)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(60, 8)"
        >
          <path d="M30 12 C 22 11, 16 15, 16 22 C 12 24, 12 30, 16 32 C 14 36, 18 42, 24 42 C 26 46, 32 46, 30 42 Z" />
          <path d="M30 12 C 38 11, 44 15, 44 22 C 48 24, 48 30, 44 32 C 46 36, 42 42, 36 42 C 34 46, 28 46, 30 42 Z" />
          <path d="M30 13 L 30 42" strokeOpacity="0.4" />
          {/* Electrode leads */}
          <line x1="20" y1="42" x2="20" y2="54" strokeWidth="1.2" strokeOpacity="0.5" />
          <line x1="30" y1="44" x2="30" y2="54" strokeWidth="1.2" strokeOpacity="0.5" />
          <line x1="40" y1="42" x2="40" y2="54" strokeWidth="1.2" strokeOpacity="0.5" />
          <circle cx="20" cy="56" r="1.6" fill="#027e7e" className="eeg-electrode eeg-electrode-1" />
          <circle cx="30" cy="56" r="1.6" fill="#027e7e" className="eeg-electrode eeg-electrode-2" />
          <circle cx="40" cy="56" r="1.6" fill="#027e7e" className="eeg-electrode eeg-electrode-3" />
        </g>

        {/* Ligne de base horizontale */}
        <line
          x1="10"
          y1="100"
          x2="170"
          y2="100"
          stroke="#027e7e"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Onde EEG — répétée pour le scroll, sous un masque */}
        <g className="eeg-wave-wrapper">
          <path
            d="
              M -180 100
              L -168 100 L -160 88 L -152 100 L -148 100 L -144 76 L -140 100 L -136 100
              L -124 100 L -118 94 L -112 100 L -108 100 L -102 80 L -96 100 L -90 100
              L -78 100 L -72 90 L -66 100 L -60 100 L -54 72 L -48 100 L -42 100
              L -30 100 L -24 94 L -18 100 L -12 100 L -6 82 L 0 100
              L 12 100 L 20 88 L 28 100 L 32 100 L 36 76 L 40 100 L 44 100
              L 56 100 L 62 94 L 68 100 L 72 100 L 78 80 L 84 100 L 90 100
              L 102 100 L 108 90 L 114 100 L 120 100 L 126 72 L 132 100 L 138 100
              L 150 100 L 156 94 L 162 100 L 168 100 L 174 82 L 180 100
            "
            stroke="url(#eeg-wave-gradient)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="eeg-wave"
          />
        </g>

        {/* Masque bord gauche/droit pour fondu */}
        <rect x="0" y="60" width="10" height="60" fill="url(#eeg-fade-left)" />
        <rect x="170" y="60" width="10" height="60" fill="url(#eeg-fade-right)" />
        <defs>
          <linearGradient id="eeg-fade-left" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fdf9f4" stopOpacity="1" />
            <stop offset="100%" stopColor="#fdf9f4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="eeg-fade-right" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fdf9f4" stopOpacity="0" />
            <stop offset="100%" stopColor="#fdf9f4" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      <style jsx>{`
        .neuro-eeg-glyph {
          position: relative;
          display: inline-block;
        }

        /* Onde EEG qui défile en boucle */
        .neuro-eeg-glyph :global(.eeg-wave) {
          animation: eeg-scroll 2.4s linear infinite;
        }

        /* Électrodes qui pulsent à tour de rôle */
        .neuro-eeg-glyph :global(.eeg-electrode) {
          transform-box: fill-box;
          transform-origin: center;
          animation: eeg-electrode-pulse 2.4s ease-in-out infinite;
        }
        .neuro-eeg-glyph :global(.eeg-electrode-1) {
          animation-delay: 0s;
        }
        .neuro-eeg-glyph :global(.eeg-electrode-2) {
          animation-delay: 0.3s;
        }
        .neuro-eeg-glyph :global(.eeg-electrode-3) {
          animation-delay: 0.6s;
        }

        /* Cerveau — souffle discret */
        .neuro-eeg-glyph :global(.eeg-brain) {
          transform-origin: 90px 27px;
          animation: eeg-brain-breath 2.4s ease-in-out infinite;
        }

        @keyframes eeg-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(180px);
          }
        }

        @keyframes eeg-electrode-pulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.4);
            opacity: 1;
            fill: #f0879f;
          }
        }

        @keyframes eeg-brain-breath {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neuro-eeg-glyph :global(.eeg-wave),
          .neuro-eeg-glyph :global(.eeg-electrode),
          .neuro-eeg-glyph :global(.eeg-brain) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );

  if (isFullscreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6"
        style={{
          background: 'radial-gradient(ellipse at center, #fdf9f4 0%, #f4ede2 100%)',
        }}
      >
        {glyph}
        <p
          className={
            messageClassName ?? 'mt-8 text-gray-700 font-semibold text-lg tracking-wide'
          }
          style={{ fontFamily: 'Verdana, sans-serif' }}
        >
          {resolvedMessage}
        </p>
        <span className="sr-only">{resolvedMessage}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex flex-col items-center justify-center"
    >
      {glyph}
      {message ? (
        <p
          className={
            messageClassName ?? 'mt-4 text-gray-600 text-sm font-medium tracking-wide'
          }
        >
          {message}
        </p>
      ) : null}
      <span className="sr-only">{resolvedMessage}</span>
    </div>
  );
}
