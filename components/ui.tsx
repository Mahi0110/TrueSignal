import type { PropsWithChildren } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { colors } from "@/constants/theme";
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  shell: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 64,
    gap: 18,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -1,
  },
  heading: { fontSize: 22, fontWeight: "800", color: colors.text },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.signal,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  dark: { backgroundColor: colors.text, borderColor: colors.text },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#FFF",
    color: colors.text,
    padding: 14,
    fontSize: 15,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.signal,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFF", fontWeight: "800", fontSize: 14 },
  soft: { backgroundColor: colors.signalSoft },
  error: { color: "#A33121", fontSize: 14, lineHeight: 21 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: "700", color: colors.text },
});
export function Page({
  children,
  title,
  subtitle,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <SafeAreaView style={ui.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={ui.shell}
      >
        <View style={ui.row}>
          <Button
            label="← Home"
            secondary
            onPress={() => router.replace("/")}
          />
          <Text style={ui.eyebrow}>TRUESIGNAL</Text>
        </View>
        <Text style={ui.title}>{title}</Text>
        {subtitle && <Text style={ui.body}>{subtitle}</Text>}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Button({
  label,
  onPress,
  disabled,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[ui.button, secondary && ui.soft, disabled && { opacity: 0.45 }]}
    >
      <Text style={[ui.buttonText, secondary && { color: colors.signal }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  multiline,
  maxLength = 1000,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[
          ui.input,
          multiline && { minHeight: 85, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function Chips({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string[];
  onSelect: (s: string) => void;
}) {
  return (
    <View style={ui.row}>
      {options.map((x) => (
        <TouchableOpacity
          key={x}
          accessibilityRole="button"
          accessibilityState={{ selected: selected.includes(x) }}
          onPress={() => onSelect(x)}
          style={[
            ui.button,
            { borderRadius: 24 },
            !selected.includes(x) && ui.soft,
          ]}
        >
          <Text
            style={[
              ui.buttonText,
              !selected.includes(x) && { color: colors.signal },
            ]}
          >
            {x}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return text ? (
    <Text accessibilityLiveRegion="polite" style={error ? ui.error : ui.note}>
      {text}
    </Text>
  ) : null;
}
export function Loading() {
  return (
    <ActivityIndicator
      accessibilityLabel="Loading"
      color={colors.signal}
      style={{ padding: 24 }}
    />
  );
}
