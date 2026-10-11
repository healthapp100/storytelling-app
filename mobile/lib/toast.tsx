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

const COLORS: Record<ToastKind, string> = {
  success: "#7FC49A",
  error: "#E8786A",
  celebrate: "#E8B03A",
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
          <View style={[styles.edge, { backgroundColor: COLORS[toast.kind] }]} />
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
    paddingVertical: 14,
    paddingRight: 16,
    paddingLeft: 0,
    overflow: "hidden",
    elevation: 6,
    zIndex: 1000,
  },
  edge: { alignSelf: "stretch", width: 5, marginVertical: -14 },
  message: { color: colors.cream, fontSize: 15, lineHeight: 21, flex: 1, marginLeft: 2 },
});
