import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import type { LoanStatus } from "../types";

const CONFIG: Record<LoanStatus, { label: string; bg: string; fg: string }> = {
  repaid: { label: "Repaid", bg: colors.greenSoft, fg: colors.greenDark },
  overdue: { label: "Overdue", bg: colors.redSoft, fg: colors.red },
  pending: { label: "Pending", bg: colors.blueSoft, fg: colors.navy },
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  const c = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]} accessibilityLabel={`Status: ${c.label}`}>
      <Text style={[styles.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" },
  text: { fontSize: 12, fontWeight: "700" },
});
