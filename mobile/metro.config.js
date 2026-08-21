const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// getSentryExpoConfig wraps Expo's default Metro config so debug IDs get
// attached to the JS bundle — that's what lets a Sentry error be traced
// back to a specific release/source line instead of just "something threw".
module.exports = getSentryExpoConfig(__dirname);
