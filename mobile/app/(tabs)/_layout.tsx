import { Redirect, Tabs } from "expo-router";
import { useSession } from "../../lib/session";

export default function TabsLayout() {
  const { session, loading } = useSession();

  if (!loading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="sections" options={{ title: "Sections" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
