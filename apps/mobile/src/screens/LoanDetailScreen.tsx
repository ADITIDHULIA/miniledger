import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { getApiBaseUrl, getErrorMessage } from "../api/client";
import { deleteLoan, fetchLoan } from "../api/loans";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { useRepay } from "../hooks/useRepay";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, fonts, radius } from "../theme";
import type { Loan } from "../types";
import { formatDate, formatINR } from "../utils/format";

export function LoanDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "LoanDetail">) {
  const { id } = route.params;
  const toast = useToast();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoan(await fetchLoan(id));
      setError(null);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const { markRepaid, repayingId } = useRepay(load);

  const confirmDelete = () =>
    Alert.alert("Delete this loan?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteLoan(id);
            toast("Loan deleted");
            navigation.goBack();
          } catch (e) {
            toast(getErrorMessage(e), "error");
            setDeleting(false);
          }
        },
      },
    ]);

  if (error)
    return (
      <View style={{ padding: 20 }}>
        <ErrorMessage message={error} onRetry={load} />
      </View>
    );
  if (!loan) return <LoadingIndicator />;

  const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <View style={styles.row}>
      <Text style={fonts.caption}>{label}</Text>
      <Text style={[styles.value, highlight && { color: colors.red }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{loan.friendName}</Text>
        <Text style={[styles.amount, loan.isRepaid && { color: colors.greenDark }]}>
          {formatINR(loan.amountPaise)}
        </Text>
        <StatusBadge status={loan.status} />
        <View style={styles.divider} />
        <Row label="Lent on" value={formatDate(loan.createdAt)} />
        <Row label="Due date" value={formatDate(loan.dueDate)} highlight={loan.status === "overdue"} />
        {loan.repaidAt ? <Row label="Repaid on" value={formatDate(loan.repaidAt)} /> : null}
        {loan.notes ? <Row label="Notes" value={loan.notes} /> : null}
      </View>

      {loan.receiptUrl ? (
        <View style={styles.card}>
          <Text style={fonts.heading}>Receipt</Text>
          <Image
            source={{ uri: `${getApiBaseUrl()}${loan.receiptUrl}` }}
            style={styles.receipt}
            resizeMode="cover"
            accessibilityLabel="Receipt photo"
          />
        </View>
      ) : null}

      {!loan.isRepaid ? (
        <View style={{ gap: 12 }}>
          <PrimaryButton
            title="Mark as repaid"
            onPress={() => markRepaid(loan)}
            loading={repayingId === loan.id}
            disabled={deleting}
          />
          <PrimaryButton title="Delete loan" variant="danger" onPress={confirmDelete} loading={deleting} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  name: { ...fonts.heading, fontSize: 20 },
  amount: { fontSize: 32, fontWeight: "800", color: colors.navy },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  value: { ...fonts.body, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  receipt: { width: "100%", height: 220, borderRadius: radius.md, backgroundColor: colors.border },
});
