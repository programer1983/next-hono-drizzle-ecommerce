import * as Sentry from "@sentry/nextjs";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

const tracePropagationTargets =
  apiBase.length > 0
    ? [apiBase]
    : typeof window !== "undefined"
      ? [window.location.origin, "localhost"]
      : [];

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  sendDefaultPii: true,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: false,
      blockAllMedia: false,
    }),
  ],

  tracesSampleRate: 1.0,
  tracePropagationTargets: tracePropagationTargets,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true,
});
