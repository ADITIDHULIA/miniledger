import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { getApiBaseUrl } from "../api/client";
import { colors, fonts, radius } from "../theme";
import type { Loan } from "../types";
import { formatDate, formatINR } from "../utils/format";
import { PrimaryButton } from "./PrimaryButton";
import { StatusBadge } from "./StatusBadge";

interface Props {
  loan: Loan;
  onPress?: () => void;
  onMarkRepaid?: () => void;
  repaying?: boolean;
}

export function LoanCard({ loan, onPress, onMarkRepaid, repaying }: Props) {
  const overdue = loan.status === "overdue";
  const repaid = loan.status === "repaid";
  const accent = repaid ? colors.green : overdue ? colors.red : colors.border;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${loan.friendName}, ${formatINR(loan.amountPaise)}, ${loan.status}, due ${formatDate(loan.dueDate)}`}
      style={[styles.card, { borderLeftColor: accent }, overdue && styles.overdue, repaid && styles.repaid]}
    >
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {loan.friendName}
          </Text>
          <Text style={fonts.caption}>Lent on {formatDate(loan.createdAt)}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={[styles.amount, repaid && { color: colors.greenDark }]}>
            {formatINR(loan.amountPaise)}
          </Text>
          <StatusBadge status={loan.status} />
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={[fonts.caption, overdue && { color: colors.red, fontWeight: "700" }]}>
          {repaid && loan.repaidAt
            ? `Repaid on ${formatDate(loan.repaidAt)}`
            : `Due ${formatDate(loan.dueDate)}`}
        </Text>
        {loan.receiptUrl ? (
          <Image
            source={{ uri: `${getApiBaseUrl()}${loan.receiptUrl}` }}
            style={styles.thumb}
            accessibilityLabel="Receipt thumbnail"
          />
        ) : null}
      </View>
      {loan.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {loan.notes}
        </Text>
      ) : null}
      {onMarkRepaid && !loan.isRepaid ? (
        <PrimaryButton title="Mark as repaid" variant="outline" onPress={onMarkRepaid} loading={repaying} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
    padding: 16,
    gap: 10,
  },
  overdue: { backgroundColor: colors.orangeSoft },
  repaid: { backgroundColor: "#F7FCF9" },
  top: { flexDirection: "row", gap: 12 },
  name: { fontSize: 17, fontWeight: "700", color: colors.navy },
  amount: { fontSize: 18, fontWeight: "800", color: colors.navy },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  thumb: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.border },
  notes: { ...fonts.caption, color: colors.navy },
});
