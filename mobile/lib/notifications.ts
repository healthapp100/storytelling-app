import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Best-effort — a user who denies the permission just never gets "today's
// video is up" pushes; every other feature works the same either way.
export async function registerForDailyVideoNotifications(userId: string) {
  if (!Device.isDevice) return; // push tokens aren't meaningful in a simulator

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-video", {
      name: "Today's video",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let status = existingStatus;
  if (status !== "granted") {
    const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
    status = requestedStatus;
  }
  if (status !== "granted") return;

  // Set once `eas init` has run and populated app.json's extra.eas.projectId
  // (a manual step — see mobile/README.md). Until then this call throws,
  // which we swallow: notifications just stay off.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn("No EAS project ID configured — skipping push token registration.");
    return;
  }

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
  await supabase.from("profiles").update({ push_token: pushToken }).eq("id", userId);
}
