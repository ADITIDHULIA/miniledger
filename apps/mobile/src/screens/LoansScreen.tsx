import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { FilterChips } from "../components/FilterChips";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { LoanCard } from "../components/LoanCard";
import { useLoans } from "../hooks/useLoans";
import { useRepay } from "../hooks/useRepay";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme";
import type { LoanFilter } from "../types";

const EMPTY: Record<LoanFilter, { title: string; message: string }> = {
  all: { title: "No loans yet", message: "Tap back and use “Add loan” to record your first one." },
  pending: {
    title: "Nothing pending",
    message: "You have no unpaid loans that are still within their due date.",
  },
  overdue: { title: "Nothing overdue 🎉", message: "None of your unpaid loans are past their due date." },
  repaid: { title: "No repaid loans yet", message: "Loans you mark as repaid will show up here." },
};

export function LoansScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "Loans">) {
  const [filter, setFilter] = useState<LoanFilter>(route.params?.initialFilter ?? "all");
  const { loans, loading, refreshing, error, reload } = useLoans(filter, { limit: 100 });
  const { markRepaid, repayingId } = useRepay(() => reload("refresh"));

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <FilterChips value={filter} onChange={setFilter} />
      </View>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => reload("refresh")}
              tintColor={colors.green}
            />
          }
          ListHeaderComponent={error ? <ErrorMessage message={error} onRetry={() => reload()} /> : undefined}
          ListEmptyComponent={error ? undefined : <EmptyState {...EMPTY[filter]} />}
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onPress={() => navigation.navigate("LoanDetail", { id: item.id })}
              onMarkRepaid={() => markRepaid(item)}
              repaying={repayingId === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: { paddingHorizontal: 20, paddingBottom: 8 },
  list: { padding: 20, paddingTop: 8, paddingBottom: 48 },
});
