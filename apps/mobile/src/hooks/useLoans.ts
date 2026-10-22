import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { getErrorMessage } from "../api/client";
import { fetchLoans, fetchSummary } from "../api/loans";
import type { Loan, LoanFilter, Summary } from "../types";

/** Loads loans (+ optionally the summary) from the API every time the screen gains focus. */
export function useLoans(filter: LoanFilter, options: { withSummary?: boolean; limit?: number } = {}) {
  const { withSummary = false, limit = 50 } = options;
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      try {
        const [list, sum] = await Promise.all([
          fetchLoans(filter, limit),
          withSummary ? fetchSummary() : null,
        ]);
        setLoans(list.loans);
        if (sum) setSummary(sum);
        setError(null);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, limit, withSummary],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { loans, summary, loading, refreshing, error, reload: load };
}
