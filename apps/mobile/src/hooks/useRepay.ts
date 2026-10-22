
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { getErrorMessage } from "../api/client";
import { repayLoan } from "../api/loans";
import { useToast } from "../components/Toast";
import type { Loan } from "../types";
import { formatINR } from "../utils/format";

export function useRepay(onDone: () => void) {
  const toast = useToast();
  const [repayingId, setRepayingId] = useState<string | null>(null);

  const markRepaid = useCallback(
    (loan: Loan) => {
      const confirmRepayment = async () => {
        setRepayingId(loan.id);

        try {
          await repayLoan(loan.id);
          toast(`${loan.friendName}'s loan marked as repaid`);
        } catch (error) {
          toast(getErrorMessage(error), "error");
        } finally {
          setRepayingId(null);
          onDone();
        }
      };

      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          `Mark as repaid?\n${loan.friendName} has paid back ${formatINR(loan.amountPaise)}.`,
        );

        if (confirmed) {
          void confirmRepayment();
        }

        return;
      }

      Alert.alert(
        "Mark as repaid?",
        `${loan.friendName} has paid back ${formatINR(loan.amountPaise)}.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes, mark repaid",
            onPress: () => {
              void confirmRepayment();
            },
          },
        ],
      );
    },
    [onDone, toast],
  );

  return { markRepaid, repayingId };
}
