'use client';

import React from 'react';

type Size = 'sm' | 'md' | 'lg' | 'fullscreen';

interface Props {
  size?: Size;
  message?: string;
  messageClassName?: string;
}

export default function NeuroLoaderOrbital({
  size = 'md',
  message,
  messageClassName,
}: Props) {
  const isFullscreen = size === 'fullscreen';
  const resolvedMessage = message ?? 'Chargement…';
  const glyphPx =
    size === 'sm' ? 48 : size === 'md' ? 80 : size === 'lg' ? 120 : 128;

  const glyph = (
    <div
      className="neuro-orbital-glyph"
      style={{ width: glyphPx, height: glyphPx }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="orbital-brain-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#027e7e" />
            <stop offset="100%" stopColor="#41005c" />
          </linearGradient>
          <radialGradient id="orbital-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0879f" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f0879f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ellipses orbitales (traces discrètes) */}
        <g className="orbital-paths" stroke="#027e7e" strokeOpacity="0.18" fill="none">
          <ellipse cx="60" cy="60" rx="48" ry="22" transform="rotate(0 60 60)" />
          <ellipse cx="60" cy="60" rx="48" ry="22" transform="rotate(60 60 60)" />
          <ellipse cx="60" cy="60" rx="48" ry="22" transform="rotate(120 60 60)" />
        </g>

        {/* Cerveau central compact (statique) */}
        <g
          className="orbital-brain"
          stroke="url(#orbital-brain-stroke)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M60 40 C 52 39, 46 43, 46 50 C 42 52, 42 58, 46 60 C 44 64, 48 70, 54 70 C 56 74, 62 74, 60 70 Z" />
          <path d="M60 40 C 68 39, 74 43, 74 50 C 78 52, 78 58, 74 60 C 76 64, 72 70, 66 70 C 64 74, 58 74, 60 70 Z" />
          <path d="M60 41 L 60 70" strokeOpacity="0.4" />
        </g>

        {/* Nœud orbital 1 — orbite horizontale */}
        <g className="orbital-node-1">
          <circle cx="108" cy="60" r="3.6" fill="#027e7e" />
          <circle cx="108" cy="60" r="7" fill="url(#orbital-node-glow)" />
        </g>
        {/* Nœud orbital 2 — orbite 60° */}
        <g className="orbital-node-2">
          <circle cx="108" cy="60" r="3" fill="#41005c" />
          <circle cx="108" cy="60" r="6" fill="url(#orbital-node-glow)" />
        </g>
        {/* Nœud orbital 3 — orbite 120° */}
        <g className="orbital-node-3">
          <circle cx="108" cy="60" r="3.2" fill="#f0879f" />
          <circle cx="108" cy="60" r="7" fill="url(#orbital-node-glow)" />
        </g>
        {/* Nœud orbital 4 — orbite horizontale inversée */}
        <g className="orbital-node-4">
          <circle cx="108" cy="60" r="2.6" fill="#027e7e" />
          <circle cx="108" cy="60" r="5" fill="url(#orbital-node-glow)" />
        </g>
      </svg>

      <style jsx>{`
        .neuro-orbital-glyph {
          position: relative;
          display: inline-block;
        }

        /* Orbite 1 — rapide, horizontale */
        .neuro-orbital-glyph :global(.orbital-node-1) {
          transform-origin: 60px 60px;
          animation: orbit-1 3.2s linear infinite;
        }
        /* Orbite 2 — rotation inclinée 60° */
        .neuro-orbital-glyph :global(.orbital-node-2) {
          transform-origin: 60px 60px;
          animation: orbit-2 4s linear infinite;
          animation-delay: -0.8s;
        }
        /* Orbite 3 — rotation inclinée 120°, sens inverse */
        .neuro-orbital-glyph :global(.orbital-node-3) {
          transform-origin: 60px 60px;
          animation: orbit-3 4.8s linear infinite reverse;
          animation-delay: -1.6s;
        }
        /* Orbite 4 — horizontale, sens inverse */
        .neuro-orbital-glyph :global(.orbital-node-4) {
          transform-origin: 60px 60px;
          animation: orbit-4 2.6s linear infinite reverse;
          animation-delay: -1.2s;
        }

        /* Halo orbital (trace) */
        .neuro-orbital-glyph :global(.orbital-paths) {
          animation: orbital-breath 3.2s ease-in-out infinite;
        }

        /* Cerveau central — souffle discret */
        .neuro-orbital-glyph :global(.orbital-brain) {
          transform-origin: 60px 60px;
          animation: orbital-brain-breath 3.2s ease-in-out infinite;
        }

        @keyframes orbit-1 {
          from {
            transform: rotate(0deg) translateX(0);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes orbit-2 {
          from {
            transform: rotate(60deg);
          }
          to {
            transform: rotate(420deg);
          }
        }
        @keyframes orbit-3 {
          from {
            transform: rotate(120deg);
          }
          to {
            transform: rotate(480deg);
          }
        }
        @keyframes orbit-4 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbital-breath {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes orbital-brain-breath {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.03);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neuro-orbital-glyph :global(.orbital-node-1),
          .neuro-orbital-glyph :global(.orbital-node-2),
          .neuro-orbital-glyph :global(.orbital-node-3),
          .neuro-orbital-glyph :global(.orbital-node-4),
          .neuro-orbital-glyph :global(.orbital-paths),
          .neuro-orbital-glyph :global(.orbital-brain) {
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
