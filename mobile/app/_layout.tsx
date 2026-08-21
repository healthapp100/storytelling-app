import { useEffect } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "../lib/session";

export default function RootLayout() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const videoId = response.notification.request.content.data?.videoId;
      if (typeof videoId === "string") {
        router.push({ pathname: "/video/[id]", params: { id: videoId } });
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <SessionProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="video/[id]" options={{ headerShown: true, title: "" }} />
        <Stack.Screen
          name="subscribe"
          options={{ headerShown: true, title: "Subscribe", presentation: "modal" }}
        />
      </Stack>
    </SessionProvider>
  );
}
