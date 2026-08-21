import { useCallback, useEffect, useState } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SessionProvider } from "../lib/session";
import { colors } from "../lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold, Fraunces_500Medium_Italic });

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
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="video/[id]"
          options={{ headerShown: true, title: "", headerStyle: { backgroundColor: colors.paper } }}
        />
        <Stack.Screen
          name="subscribe"
          options={{
            headerShown: true,
            title: "Subscribe",
            presentation: "modal",
            headerStyle: { backgroundColor: colors.paper },
          }}
        />
      </Stack>
    </SessionProvider>
  );
}
