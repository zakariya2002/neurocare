const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  experimental: {
    // Désactiver l'erreur pour useSearchParams sans Suspense
    missingSuspenseWithCSRBailout: false,
    // Enable instrumentation hook for Sentry server-side init
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.sentry.io https://api-adresse.data.gouv.fr ws://localhost:* http://localhost:*; frame-src 'self' https://*.supabase.co https://*.stripe.com https://*.daily.co; media-src 'self' https://*.supabase.co blob:;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.sentry.io https://api-adresse.data.gouv.fr; frame-src 'self' https://*.supabase.co https://*.stripe.com https://*.daily.co; media-src 'self' https://*.supabase.co blob:;",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externaliser pdfkit pour éviter les problèmes de bundling des fonts
      config.externals = config.externals || [];
      config.externals.push({
        'pdfkit': 'commonjs pdfkit',
        'canvas': 'canvas'
      });
    }
    return config;
  },
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry organization and project
  org: "neurocare",
  project: "neurocare",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Hide source maps from generated client bundles
  hideSourceMaps: true,
});
