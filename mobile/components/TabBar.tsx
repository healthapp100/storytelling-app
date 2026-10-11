import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { useSession } from "../lib/session";
import { colors, fonts } from "../lib/theme";

const LABELS: Record<string, string> = {
  index: "Today",
  sections: "Library",
  profile: "You",
  admin: "Manage",
};

const MARK_WIDTH = 34;

// Text-only tab bar. A single vermilion stroke along the top edge slides to
// whichever tab is active, instead of swapping icons between outline and
// filled variants.
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { isAdmin } = useSession();
  const routes = state.routes.filter((route) => route.name !== "admin" || isAdmin);
  const activeRoute = state.routes[state.index];
  const activeIndex = Math.max(
    0,
    routes.findIndex((route) => route.key === activeRoute.key)
  );

  const [width, setWidth] = useState(0);
  const itemWidth = routes.length > 0 ? width / routes.length : 0;
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!itemWidth) return;
    Animated.spring(x, {
      toValue: activeIndex * itemWidth + (itemWidth - MARK_WIDTH) / 2,
      useNativeDriver: true,
      speed: 18,
      bounciness: 4,
    }).start();
  }, [activeIndex, itemWidth, x]);

  return (
    <View
      style={[styles.bar, { paddingBottom: insets.bottom }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {itemWidth > 0 && <Animated.View style={[styles.mark, { transform: [{ translateX: x }] }]} />}
      {routes.map((route) => {
        const focused = route.key === activeRoute.key;
        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.accentSoft }]}
          >
            <Text style={[styles.label, focused ? styles.labelActive : styles.labelIdle]}>
              {LABELS[route.name] ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  mark: {
    position: "absolute",
    top: -1,
    left: 0,
    width: MARK_WIDTH,
    height: 3,
    backgroundColor: colors.accent,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16 },
  label: { fontFamily: fonts.displayMedium, fontSize: 16 },
  labelActive: { color: colors.ink },
  labelIdle: { color: colors.inkFaint },
});
