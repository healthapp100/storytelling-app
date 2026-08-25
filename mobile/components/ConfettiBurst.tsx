import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet } from "react-native";
import { colors } from "../lib/theme";

const { width } = Dimensions.get("window");
const PIECE_COLORS = [colors.accent, colors.night, colors.success, "#E8B44A", "#7A9E7E"];
const PIECE_COUNT = 22;

// A lightweight, pure-Animated confetti burst — no extra native dependency,
// just a handful of colored views falling from the top of the screen once,
// then unmounting. Used for genuine "you did it" moments (purchase
// success, first upload) rather than routine actions, so it stays special.
export function ConfettiBurst() {
  const pieces = useRef(
    Array.from({ length: PIECE_COUNT }, () => ({
      x: Math.random() * width,
      delay: Math.random() * 200,
      duration: 1400 + Math.random() * 700,
      rotateStart: Math.random() * 360,
      color: PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)],
      progress: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animations = pieces.map((piece) =>
      Animated.timing(piece.progress, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, [pieces]);

  return (
    <>
      {pieces.map((piece, index) => {
        const translateY = piece.progress.interpolate({ inputRange: [0, 1], outputRange: [-20, 700] });
        const opacity = piece.progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
        const rotate = piece.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [`${piece.rotateStart}deg`, `${piece.rotateStart + 480}deg`],
        });
        return (
          <Animated.View
            key={index}
            pointerEvents="none"
            style={[
              styles.piece,
              {
                left: piece.x,
                backgroundColor: piece.color,
                opacity,
                transform: [{ translateY }, { rotate }],
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    top: 0,
    width: 8,
    height: 12,
    borderRadius: 2,
    zIndex: 999,
  },
});
