const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  experimental: {
    // Désactiver l'erreur pour useSearchParams sans Suspense
    missingSuspenseWithCSRBailout: false,
    // Enable instrumentation hook for Sentry server-side init
    instrumentationHook: true,
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
