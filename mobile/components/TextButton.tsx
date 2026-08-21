import { Pressable, Text, type PressableProps, type StyleProp, type TextStyle } from "react-native";

type Props = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<TextStyle>;
  children: string;
};

// A text-only tappable label (Edit / Delete / Cancel / Feature, etc.) that
// visibly dims on press — the small-scale counterpart to Pressy, used
// wherever a full scale/lift effect would be too much for a plain link.
export function TextButton({ style, children, ...rest }: Props) {
  return (
    <Pressable {...rest}>
      {({ pressed }) => <Text style={[style, pressed && { opacity: 0.5 }]}>{children}</Text>}
    </Pressable>
  );
}
