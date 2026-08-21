import { TextInput, type TextInputProps } from "react-native";
import { colors } from "../lib/theme";

// A thin wrapper that defaults placeholderTextColor and text color to
// visible, theme-correct values. Plain <TextInput> from react-native
// renders both as whatever the OS/OEM skin defaults to — on some Android
// skins that's very light grey or white, making text and placeholders
// invisible on this app's light backgrounds. Use this everywhere instead
// of importing TextInput directly, so the fix can't be missed on a new
// screen the way it originally was on every admin form.
export function AppTextInput({ style, placeholderTextColor, ...rest }: TextInputProps) {
  return (
    <TextInput
      style={[{ color: colors.ink }, style]}
      placeholderTextColor={placeholderTextColor ?? colors.inkFaint}
      {...rest}
    />
  );
}
