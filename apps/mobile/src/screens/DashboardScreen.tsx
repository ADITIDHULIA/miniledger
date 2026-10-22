import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { LoanCard } from "../components/LoanCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { SummaryCard } from "../components/SummaryCard";
import { useAuth } from "../context/AuthContext";
import { useLoans } from "../hooks/useLoans";
import { useRepay } from "../hooks/useRepay";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, fonts } from "../theme";

export function DashboardScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Dashboard">) {
  const { user, signOut } = useAuth();
  const { loans, summary, loading, refreshing, error, reload } = useLoans("all", {
    withSummary: true,
    limit: 5,
  });
  const { markRepaid, repayingId } = useRepay(() => reload("refresh"));

  const confirmLogout = () =>
    Alert.alert("Log out?", "You'll need a new OTP to log back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: signOut },
    ]);

  const header = (
    <View style={{ gap: 16 }}>
      <View style={styles.topRow}>
        <View>
          <Text style={fonts.title}>Welcome back 👋</Text>
          <Text style={fonts.caption}>{user?.phone}</Text>
        </View>
        <Pressable
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          hitSlop={10}
          style={styles.logout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.navy} />
        </Pressable>
      </View>
      {summary ? <SummaryCard summary={summary} /> : null}
      <PrimaryButton title="+ Add loan" onPress={() => navigation.navigate("AddLoan")} />
      {error ? <ErrorMessage message={error} onRetry={() => reload()} /> : null}
      <View style={styles.sectionRow}>
        <Text style={fonts.heading}>Recent loans</Text>
        <Pressable onPress={() => navigation.navigate("Loans")} accessibilityRole="link" hitSlop={10}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {loading && !summary ? (
        <LoadingIndicator label="Loading your ledger…" />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={header}
          ListHeaderComponentStyle={{ marginBottom: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => reload("refresh")}
              tintColor={colors.green}
            />
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onPress={() => navigation.navigate("LoanDetail", { id: item.id })}
              onMarkRepaid={() => markRepaid(item)}
              repaying={repayingId === item.id}
            />
          )}
          ListEmptyComponent={
            error ? undefined : (
              <EmptyState
                title="No loans yet"
                message="When you lend money to a friend, add it here and MiniLedger will track it for you."
                actionLabel="Add your first loan"
                onAction={() => navigation.navigate("AddLoan")}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20, paddingBottom: 48 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logout: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  link: { color: colors.greenDark, fontWeight: "700" },
});
