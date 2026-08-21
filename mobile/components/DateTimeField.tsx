import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../lib/theme";

function formatForDisplay(date: Date): string {
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// Android's native picker only ever shows one mode (date OR time) per
// dialog — "datetime" mode isn't supported there the way it is on iOS, so
// this shows the date dialog first and chains straight into the time
// dialog on Android, while iOS gets a single combined picker.
export function DateTimeField({
  value,
  onChange,
  label,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  label: string;
}) {
  const [stage, setStage] = useState<"closed" | "date" | "time">("closed");
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const open = () => {
    setDraft(value ?? new Date());
    setStage("date");
  };

  if (Platform.OS === "android") {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Pressable style={styles.button} onPress={open}>
          <Text style={value ? styles.buttonValue : styles.buttonPlaceholder}>
            {value ? formatForDisplay(value) : "Choose a date and time"}
          </Text>
        </Pressable>

        {stage === "date" && (
          <DateTimePicker
            value={draft}
            mode="date"
            display="default"
            onChange={(event, selected) => {
              if (event.type === "dismissed" || !selected) {
                setStage("closed");
                return;
              }
              setDraft(selected);
              setStage("time");
            }}
          />
        )}
        {stage === "time" && (
          <DateTimePicker
            value={draft}
            mode="time"
            display="default"
            onChange={(event, selected) => {
              setStage("closed");
              if (event.type === "dismissed" || !selected) return;
              onChange(selected);
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.button} onPress={open}>
        <Text style={value ? styles.buttonValue : styles.buttonPlaceholder}>
          {value ? formatForDisplay(value) : "Choose a date and time"}
        </Text>
      </Pressable>
      {stage !== "closed" && (
        <DateTimePicker
          value={draft}
          mode="datetime"
          display="inline"
          onChange={(event, selected) => {
            if (event.type === "dismissed" || !selected) {
              setStage("closed");
              return;
            }
            setDraft(selected);
            onChange(selected);
            setStage("closed");
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, color: colors.inkMuted },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buttonValue: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  buttonPlaceholder: { color: colors.inkFaint, fontSize: 14 },
});
