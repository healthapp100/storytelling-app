import { Redirect, Stack } from "expo-router";
import { useSession } from "../../lib/session";

export default function AuthLayout() {
  const { session, loading } = useSession();

  if (!loading && session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
