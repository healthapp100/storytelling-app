import * as Sentry from "@sentry/react-native";

// A missing DSN just means crash reporting is off — never block the app
// over it. Sentry.init also wires up global JS + native crash handlers on
// both platforms automatically, so nothing else needs to call into it.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Reflects EAS's build channel (development/preview/production) so
    // crashes can be filtered by which build actually produced them.
    // Left enabled in dev too, on purpose — that's how you verify a test
    // crash actually shows up in the Sentry dashboard before relying on it.
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
  });
} else if (__DEV__) {
  console.warn("EXPO_PUBLIC_SENTRY_DSN is not set — crash reporting is disabled.");
}

export { Sentry };
