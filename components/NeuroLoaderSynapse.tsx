'use client';

import React from 'react';

type Size = 'sm' | 'md' | 'lg' | 'fullscreen';

interface Props {
  size?: Size;
  message?: string;
  messageClassName?: string;
}

export default function NeuroLoaderSynapse({
  size = 'md',
  message,
  messageClassName,
}: Props) {
  const isFullscreen = size === 'fullscreen';
  const resolvedMessage = message ?? 'Chargement…';
  const glyphPx =
    size === 'sm' ? 56 : size === 'md' ? 96 : size === 'lg' ? 140 : 160;

  const glyph = (
    <div
      className="neuro-synapse-glyph"
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
          <linearGradient id="synapse-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#027e7e" />
            <stop offset="100%" stopColor="#41005c" />
          </linearGradient>
          <radialGradient id="synapse-pulse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0879f" stopOpacity="1" />
            <stop offset="60%" stopColor="#f0879f" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f0879f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="synapse-soma" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#3ba5a5" />
            <stop offset="100%" stopColor="#027e7e" />
          </radialGradient>
          <radialGradient id="synapse-soma-right" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#6b2d8a" />
            <stop offset="100%" stopColor="#41005c" />
          </radialGradient>
        </defs>

        {/* Neurone gauche — soma + dendrites */}
        <g className="synapse-neuron-left">
          {/* Dendrites gauche */}
          <g stroke="#027e7e" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M 38 65 Q 22 52, 10 50" />
            <path d="M 38 65 Q 22 66, 8 72" />
            <path d="M 38 65 Q 22 78, 12 90" />
            <path d="M 38 65 Q 26 58, 16 42" />
            <path d="M 38 65 Q 28 74, 20 88" />
          </g>
          {/* Soma */}
          <circle cx="44" cy="65" r="10" fill="url(#synapse-soma)" className="synapse-soma synapse-soma-left" />
          <circle cx="41" cy="62" r="3" fill="#ffffff" fillOpacity="0.35" />
        </g>

        {/* Axone central (reliant les deux neurones) */}
        <g>
          <path
            d="M 54 65 L 124 65"
            stroke="url(#synapse-stroke)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeOpacity="0.4"
          />
          {/* Gaine de myéline — petits segments */}
          <g className="synapse-myelin" stroke="#027e7e" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round">
            <line x1="62" y1="65" x2="72" y2="65" />
            <line x1="80" y1="65" x2="90" y2="65" />
            <line x1="98" y1="65" x2="108" y2="65" />
            <line x1="116" y1="65" x2="122" y2="65" />
          </g>
        </g>

        {/* Impulsion (pulse) qui voyage le long de l'axone */}
        <g className="synapse-pulse">
          <circle cx="54" cy="65" r="8" fill="url(#synapse-pulse-glow)" />
          <circle cx="54" cy="65" r="3" fill="#f0879f" />
        </g>

        {/* Espace synaptique (entre axone et neurone droit) */}
        <g className="synapse-gap" stroke="#f0879f" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round">
          <line x1="126" y1="60" x2="128" y2="58" />
          <line x1="126" y1="65" x2="128" y2="65" />
          <line x1="126" y1="70" x2="128" y2="72" />
        </g>

        {/* Neurone droit — soma + dendrites */}
        <g className="synapse-neuron-right">
          <circle cx="136" cy="65" r="10" fill="url(#synapse-soma-right)" className="synapse-soma synapse-soma-right" />
          <circle cx="133" cy="62" r="3" fill="#ffffff" fillOpacity="0.35" />
          {/* Dendrites droite */}
          <g stroke="#41005c" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" fill="none">
            <path d="M 142 65 Q 158 52, 170 50" />
            <path d="M 142 65 Q 158 66, 172 72" />
            <path d="M 142 65 Q 158 78, 168 90" />
            <path d="M 142 65 Q 154 58, 164 42" />
            <path d="M 142 65 Q 152 74, 160 88" />
          </g>
        </g>
      </svg>

      <style jsx>{`
        .neuro-synapse-glyph {
          position: relative;
          display: inline-block;
        }

        /* Impulsion qui voyage */
        .neuro-synapse-glyph :global(.synapse-pulse) {
          animation: synapse-travel 2s cubic-bezier(0.55, 0, 0.45, 1) infinite;
        }

        /* Soma gauche — émet l'impulsion */
        .neuro-synapse-glyph :global(.synapse-soma-left) {
          transform-box: fill-box;
          transform-origin: center;
          animation: synapse-soma-emit 2s ease-in-out infinite;
        }

        /* Soma droit — reçoit l'impulsion (décalé) */
        .neuro-synapse-glyph :global(.synapse-soma-right) {
          transform-box: fill-box;
          transform-origin: center;
          animation: synapse-soma-receive 2s ease-in-out infinite;
          animation-delay: 0.85s;
        }

        /* Gaine de myéline — léger shimmer */
        .neuro-synapse-glyph :global(.synapse-myelin) {
          animation: synapse-myelin-shimmer 2s ease-in-out infinite;
        }

        @keyframes synapse-travel {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          85% {
            transform: translateX(72px);
            opacity: 1;
          }
          95% {
            transform: translateX(72px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 0;
          }
        }

        @keyframes synapse-soma-emit {
          0%,
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
          8% {
            transform: scale(1.15);
            filter: brightness(1.3);
          }
          20% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        @keyframes synapse-soma-receive {
          0%,
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
          10% {
            transform: scale(1.15);
            filter: brightness(1.3);
          }
          25% {
            transform: scale(1);
            filter: brightness(1);
          }
        }

        @keyframes synapse-myelin-shimmer {
          0%,
          100% {
            stroke-opacity: 0.2;
          }
          50% {
            stroke-opacity: 0.45;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neuro-synapse-glyph :global(.synapse-pulse),
          .neuro-synapse-glyph :global(.synapse-soma-left),
          .neuro-synapse-glyph :global(.synapse-soma-right),
          .neuro-synapse-glyph :global(.synapse-myelin) {
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
