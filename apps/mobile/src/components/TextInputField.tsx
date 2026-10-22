import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, fonts, radius } from "../theme";

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  prefix?: string;
}

export function TextInputField({ label, error, prefix, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !!error && styles.fieldError]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#94A3B8"
          style={[styles.input, rest.multiline && styles.multiline, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...fonts.body, fontWeight: "600", marginBottom: 6 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  fieldError: { borderColor: colors.red },
  prefix: { ...fonts.body, color: colors.muted, marginRight: 8, fontWeight: "600" },
  input: { flex: 1, minHeight: 50, fontSize: 16, color: colors.navy },
  multiline: { minHeight: 90, textAlignVertical: "top", paddingTop: 12 },
  error: { color: colors.red, fontSize: 13, marginTop: 4 },
});
