import { Redirect, Tabs } from "expo-router";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";

export default function TabsLayout() {
  const { session, loading } = useSession();

  if (!loading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.paperRaised, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="sections" options={{ title: "Sections" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
