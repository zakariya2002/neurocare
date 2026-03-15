import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only capture errors, no performance monitoring
  tracesSampleRate: 0,

  // Disable session replay
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Only send events in production
  enabled: process.env.NODE_ENV === "production",
});
