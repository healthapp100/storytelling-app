import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useSession } from "../../lib/session";
import { colors } from "../../lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} color={color as string} size={size} />;
}

export default function TabsLayout() {
  const { session, loading, isAdmin } = useSession();

  if (!loading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.paperRaised, borderTopColor: colors.border, height: 60, paddingTop: 6 },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          title: "Sections",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "book" : "book-outline"} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "person-circle" : "person-circle-outline"} color={color} size={22} />
          ),
        }}
      />
      {/* Present in the tab bar only for accounts with role='admin' — hidden
          via href:null rather than omitted, since Expo Router needs the
          screen registered either way for admin-section/[id] navigation
          started from within it to work. */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? "shield-checkmark" : "shield-checkmark-outline"} color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
