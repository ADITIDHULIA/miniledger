import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import type { Summary } from "../types";
import { formatINR } from "../utils/format";

export function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <View style={styles.card} accessibilityLabel="Loan summary">
      <Text style={styles.heroLabel}>Total lent</Text>
      <Text style={styles.heroValue} accessibilityLabel={`Total lent ${formatINR(summary.totalLentPaise)}`}>
        {formatINR(summary.totalLentPaise)}
      </Text>
      <View style={styles.row}>
        <View style={[styles.stat, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <Text style={styles.statLabel}>Repaid</Text>
          <Text style={[styles.statValue, { color: "#6EE7A0" }]}>{formatINR(summary.totalRepaidPaise)}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <Text style={styles.statLabel}>Overdue</Text>
          <Text
            style={[styles.statValue, { color: summary.overdueAmountPaise > 0 ? "#FDA4A4" : colors.white }]}
          >
            {formatINR(summary.overdueAmountPaise)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: radius.lg + 4, padding: 20, gap: 4 },
  heroLabel: { color: "#A9B7CC", fontSize: 13 },
  heroValue: { color: colors.white, fontSize: 34, fontWeight: "800", marginBottom: 12 },
  row: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, borderRadius: radius.md, padding: 12 },
  statLabel: { color: "#A9B7CC", fontSize: 12, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: "700" },
});
