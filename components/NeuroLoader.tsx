'use client';

import React from 'react';

type NeuroLoaderSize = 'sm' | 'md' | 'lg' | 'fullscreen';

interface NeuroLoaderProps {
  size?: NeuroLoaderSize;
  message?: string;
  /**
   * Optional inline override (e.g. if you embed the loader inside a dark panel).
   * Only applied to the message text, not to the loader glyph itself.
   */
  messageClassName?: string;
}

/**
 * NeuroLoader — premium loading indicator inspired by the NeuroCare brand mark.
 *
 * Uses an inline SVG stylized brain silhouette with a small neural network
 * overlay. The strokes breathe via a slow scale/opacity animation while the
 * neural nodes light up in cascade. No external dependency, pure Tailwind +
 * SVG + CSS keyframes injected via <style jsx>.
 *
 * Accessibility: role="status" + aria-live="polite" and an sr-only fallback
 * for the message.
 */
export default function NeuroLoader({
  size = 'md',
  message,
  messageClassName,
}: NeuroLoaderProps) {
  const isFullscreen = size === 'fullscreen';
  const resolvedMessage = message ?? 'Chargement…';

  // Resolve the glyph dimension (square) per size variant.
  const glyphPx =
    size === 'sm' ? 48 : size === 'md' ? 80 : size === 'lg' ? 120 : 112;

  const glyph = (
    <div
      className="neuro-loader-glyph"
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
          <linearGradient id="neuro-brain-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#027e7e" />
            <stop offset="100%" stopColor="#41005c" />
          </linearGradient>
          <radialGradient id="neuro-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0879f" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f0879f" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer breathing halo */}
        <circle
          cx="60"
          cy="60"
          r="52"
          stroke="#027e7e"
          strokeOpacity="0.12"
          strokeWidth="1"
          className="neuro-halo"
        />

        {/* Stylized brain silhouette (two hemispheres) */}
        <g
          className="neuro-brain"
          stroke="url(#neuro-brain-stroke)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Left hemisphere outline */}
          <path d="M60 28 C 46 26, 34 34, 32 46 C 24 48, 22 58, 28 64 C 24 72, 30 82, 40 82 C 44 90, 56 92, 60 86 Z" />
          {/* Right hemisphere outline */}
          <path d="M60 28 C 74 26, 86 34, 88 46 C 96 48, 98 58, 92 64 C 96 72, 90 82, 80 82 C 76 90, 64 92, 60 86 Z" />

          {/* Internal gyri — left */}
          <path
            d="M42 44 C 46 42, 50 46, 48 52"
            className="neuro-gyrus neuro-gyrus-1"
          />
          <path
            d="M38 58 C 44 56, 50 60, 48 68"
            className="neuro-gyrus neuro-gyrus-2"
          />
          <path
            d="M46 74 C 50 72, 54 76, 52 80"
            className="neuro-gyrus neuro-gyrus-3"
          />

          {/* Internal gyri — right */}
          <path
            d="M78 44 C 74 42, 70 46, 72 52"
            className="neuro-gyrus neuro-gyrus-1"
          />
          <path
            d="M82 58 C 76 56, 70 60, 72 68"
            className="neuro-gyrus neuro-gyrus-2"
          />
          <path
            d="M74 74 C 70 72, 66 76, 68 80"
            className="neuro-gyrus neuro-gyrus-3"
          />

          {/* Central fissure */}
          <path d="M60 30 L 60 86" strokeOpacity="0.35" />
        </g>

        {/* Neural node connections — animated via stroke-dashoffset */}
        <g
          className="neuro-network"
          stroke="#027e7e"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <line x1="42" y1="48" x2="60" y2="40" className="neuro-link neuro-link-1" />
          <line x1="60" y1="40" x2="78" y2="48" className="neuro-link neuro-link-2" />
          <line x1="42" y1="48" x2="40" y2="70" className="neuro-link neuro-link-3" />
          <line x1="78" y1="48" x2="80" y2="70" className="neuro-link neuro-link-4" />
          <line x1="40" y1="70" x2="60" y2="78" className="neuro-link neuro-link-5" />
          <line x1="60" y1="78" x2="80" y2="70" className="neuro-link neuro-link-6" />
          <line x1="60" y1="40" x2="60" y2="78" className="neuro-link neuro-link-7" />
        </g>

        {/* Neural nodes (cascade pulse) */}
        <g className="neuro-nodes">
          <circle cx="60" cy="40" r="3" fill="#027e7e" className="neuro-node neuro-node-1" />
          <circle cx="42" cy="48" r="2.6" fill="#027e7e" className="neuro-node neuro-node-2" />
          <circle cx="78" cy="48" r="2.6" fill="#027e7e" className="neuro-node neuro-node-3" />
          <circle cx="40" cy="70" r="2.6" fill="#027e7e" className="neuro-node neuro-node-4" />
          <circle cx="80" cy="70" r="2.6" fill="#027e7e" className="neuro-node neuro-node-5" />
          <circle cx="60" cy="78" r="3" fill="#f0879f" className="neuro-node neuro-node-6" />
        </g>
      </svg>

      <style jsx>{`
        .neuro-loader-glyph {
          position: relative;
          display: inline-block;
        }

        /* Slow breathing halo */
        .neuro-loader-glyph :global(.neuro-halo) {
          transform-origin: 60px 60px;
          animation: neuro-halo-pulse 2.4s ease-in-out infinite;
        }

        /* Brain silhouette — gentle overall breathing */
        .neuro-loader-glyph :global(.neuro-brain) {
          transform-origin: 60px 60px;
          animation: neuro-brain-breathe 2.4s ease-in-out infinite;
        }

        /* Internal gyri — offset opacity pulses */
        .neuro-loader-glyph :global(.neuro-gyrus) {
          opacity: 0.55;
          animation: neuro-gyrus-pulse 2.4s ease-in-out infinite;
        }
        .neuro-loader-glyph :global(.neuro-gyrus-1) {
          animation-delay: 0s;
        }
        .neuro-loader-glyph :global(.neuro-gyrus-2) {
          animation-delay: 0.35s;
        }
        .neuro-loader-glyph :global(.neuro-gyrus-3) {
          animation-delay: 0.7s;
        }

        /* Connections — draw-in with stroke-dashoffset */
        .neuro-loader-glyph :global(.neuro-link) {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          opacity: 0.7;
          animation: neuro-link-draw 2.4s ease-in-out infinite;
        }
        .neuro-loader-glyph :global(.neuro-link-1) { animation-delay: 0s; }
        .neuro-loader-glyph :global(.neuro-link-2) { animation-delay: 0.15s; }
        .neuro-loader-glyph :global(.neuro-link-3) { animation-delay: 0.3s; }
        .neuro-loader-glyph :global(.neuro-link-4) { animation-delay: 0.45s; }
        .neuro-loader-glyph :global(.neuro-link-5) { animation-delay: 0.6s; }
        .neuro-loader-glyph :global(.neuro-link-6) { animation-delay: 0.75s; }
        .neuro-loader-glyph :global(.neuro-link-7) { animation-delay: 0.9s; }

        /* Nodes — cascade scale + opacity pulse */
        .neuro-loader-glyph :global(.neuro-node) {
          transform-box: fill-box;
          transform-origin: center;
          animation: neuro-node-pulse 2.4s ease-in-out infinite;
        }
        .neuro-loader-glyph :global(.neuro-node-1) { animation-delay: 0s; }
        .neuro-loader-glyph :global(.neuro-node-2) { animation-delay: 0.2s; }
        .neuro-loader-glyph :global(.neuro-node-3) { animation-delay: 0.4s; }
        .neuro-loader-glyph :global(.neuro-node-4) { animation-delay: 0.6s; }
        .neuro-loader-glyph :global(.neuro-node-5) { animation-delay: 0.8s; }
        .neuro-loader-glyph :global(.neuro-node-6) { animation-delay: 1s; }

        @keyframes neuro-halo-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.75;
          }
        }

        @keyframes neuro-brain-breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 0.92;
          }
          50% {
            transform: scale(1.015);
            opacity: 1;
          }
        }

        @keyframes neuro-gyrus-pulse {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.85;
          }
        }

        @keyframes neuro-link-draw {
          0% {
            stroke-dashoffset: 40;
            opacity: 0.15;
          }
          40% {
            stroke-dashoffset: 0;
            opacity: 0.8;
          }
          70% {
            stroke-dashoffset: 0;
            opacity: 0.6;
          }
          100% {
            stroke-dashoffset: -40;
            opacity: 0.15;
          }
        }

        @keyframes neuro-node-pulse {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .neuro-loader-glyph :global(.neuro-halo),
          .neuro-loader-glyph :global(.neuro-brain),
          .neuro-loader-glyph :global(.neuro-gyrus),
          .neuro-loader-glyph :global(.neuro-link),
          .neuro-loader-glyph :global(.neuro-node) {
            animation: none;
          }
          .neuro-loader-glyph :global(.neuro-link) {
            stroke-dashoffset: 0;
            opacity: 0.6;
          }
          .neuro-loader-glyph :global(.neuro-gyrus) {
            opacity: 0.7;
          }
          .neuro-loader-glyph :global(.neuro-node) {
            opacity: 0.9;
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
          background:
            'radial-gradient(ellipse at center, #fdf9f4 0%, #f4ede2 100%)',
        }}
      >
        {glyph}
        <p
          className={
            messageClassName ??
            'mt-8 text-gray-700 font-semibold text-lg tracking-wide'
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
            messageClassName ??
            'mt-4 text-gray-600 text-sm font-medium tracking-wide'
          }
        >
          {message}
        </p>
      ) : null}
      <span className="sr-only">{resolvedMessage}</span>
    </div>
  );
}
