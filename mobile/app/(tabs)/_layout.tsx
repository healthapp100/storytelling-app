import { Redirect, Tabs } from "expo-router";
import { TabBar } from "../../components/TabBar";
import { useSession } from "../../lib/session";

export default function TabsLayout() {
  const { session, loading } = useSession();

  if (!loading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // The bar itself is custom (components/TabBar). The admin tab stays
  // registered for every account — Expo Router needs the screen to exist for
  // admin-section/[id] navigation — and TabBar simply doesn't draw it for
  // anyone who isn't an admin.
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="sections" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="admin" />
    </Tabs>
  );
}
