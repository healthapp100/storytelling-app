import { useCallback, useEffect, useState } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Eczar_600SemiBold, Eczar_700Bold } from "@expo-google-fonts/eczar";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../lib/session";
import { ToastProvider } from "../lib/toast";
import { colors, fonts } from "../lib/theme";
// Importing this runs Sentry.init as a side effect — must happen before
// anything else so it can catch errors thrown during startup too.
import { Sentry } from "../lib/sentry";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  const [fontsLoaded] = useFonts({ Eczar_600SemiBold, Eczar_700Bold });

  const onLayoutReady = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const videoId = response.notification.request.content.data?.videoId;
      if (typeof videoId === "string") {
        router.push({ pathname: "/video/[id]", params: { id: videoId } });
      }
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.paper },
              headerStyle: { backgroundColor: colors.paper },
              headerShadowVisible: false,
              headerTintColor: colors.ink,
              headerTitleStyle: { fontFamily: fonts.displayMedium, fontSize: 18 },
              animation: "fade_from_bottom",
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="video/[id]" options={{ headerShown: true, title: "" }} />
            <Stack.Screen name="admin-section/[id]" options={{ headerShown: true, title: "" }} />
            <Stack.Screen
              name="subscribe"
              options={{ headerShown: true, title: "Plans", presentation: "modal" }}
            />
          </Stack>
        </ToastProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

// Sentry.wrap adds a top-level error boundary and touch-event/navigation
// breadcrumbs around the whole app — this is the officially recommended way
// to mount it, not just calling Sentry.init on its own.
export default Sentry.wrap(RootLayout);
