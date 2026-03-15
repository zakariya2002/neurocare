import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Only capture errors, no performance monitoring
  tracesSampleRate: 0,

  // Set environment
  environment: process.env.NODE_ENV,

  // Only send events in production
  enabled: process.env.NODE_ENV === "production",
});
