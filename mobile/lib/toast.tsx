import { Ionicons } from "@expo/vector-icons";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfettiBurst } from "../components/ConfettiBurst";
import { colors, radii, spacing } from "./theme";

type ToastKind = "success" | "error" | "celebrate";

type ToastState = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const ICONS: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  celebrate: "sparkles",
};

const COLORS: Record<ToastKind, string> = {
  success: colors.success,
  error: colors.danger,
  celebrate: colors.accent,
};

// One shared toast + celebration layer mounted once at the app root — any
// screen calls useToast().showToast(...) instead of each screen building
// its own success/error banner. "celebrate" also fires a confetti burst,
// for moments worth making feel like a moment (purchase, upload success).
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const nextId = useRef(0);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++nextId.current;
      setToast({ id, message, kind });
      if (kind === "celebrate") setConfettiKey((k) => k + 1);

      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setToast((current) => (current?.id === id ? null : current));
      });
    },
    [opacity]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { top: insets.top + spacing.sm, opacity }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: COLORS[toast.kind] }]}>
            <Ionicons name={ICONS[toast.kind]} size={16} color="#fff" />
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
      {confettiKey > 0 && <ConfettiBurst key={confettiKey} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.night,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 1000,
  },
  iconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  message: { color: "#fff", fontWeight: "600", fontSize: 14, flex: 1 },
});
