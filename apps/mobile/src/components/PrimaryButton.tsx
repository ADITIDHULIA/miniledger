import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
}

export function PrimaryButton({ title, onPress, loading, disabled, variant = "primary" }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        inactive && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.white : colors.navy} />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "outline" && styles.outlineText,
            variant === "danger" && styles.dangerText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: colors.green },
  outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.redSoft },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  text: { color: colors.white, fontSize: 16, fontWeight: "700" },
  outlineText: { color: colors.navy },
  dangerText: { color: colors.red },
});
