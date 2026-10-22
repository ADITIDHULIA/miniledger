import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme";
import type { LoanFilter } from "../types";

const OPTIONS: { value: LoanFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "repaid", label: "Repaid" },
];

export function FilterChips({ value, onChange }: { value: LoanFilter; onChange: (v: LoanFilter) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  text: { color: colors.navy, fontWeight: "600" },
  textActive: { color: colors.white },
});
