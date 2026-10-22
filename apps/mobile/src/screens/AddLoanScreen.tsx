
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getErrorMessage } from "../api/client";
import { createLoan } from "../api/loans";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextInputField } from "../components/TextInputField";
import { useToast } from "../components/Toast";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, fonts, radius } from "../theme";
import { formatDate, toDateOnly } from "../utils/format";
import {
  LoanFormErrors,
  validateLoanForm,
} from "../utils/validation";

export function AddLoanScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "AddLoan">) {
  const toast = useToast();

  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors] = useState<LoanFormErrors>({});
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const dateToInputValue = (date: Date | null) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const onDateChange = (
    _event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (selected) {
      setDueDate(selected);
      setErrors((prev) => ({
        ...prev,
        dueDate: undefined,
      }));
    }
  };

  const onWebDateChange = (value: string) => {
    if (!value) return;

    const [year, month, day] = value.split("-").map(Number);

    // Use local date components to avoid timezone shifting.
    const selectedDate = new Date(year, month - 1, day);

    setDueDate(selectedDate);
    setErrors((prev) => ({
      ...prev,
      dueDate: undefined,
    }));
    setShowPicker(false);
  };

  const pickReceipt = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        toast("Photo permission is needed to attach a receipt", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.6,
      });

      if (!result.canceled) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (error) {
      toast(getErrorMessage(error), "error");
    }
  };

  const submit = async () => {
    const found = validateLoanForm({
      friendName,
      amount,
      dueDate,
      notes,
    });

    setErrors(found);

    if (Object.keys(found).length > 0 || !dueDate) {
      return;
    }

    setSaving(true);

    try {
      await createLoan({
        friendName,
        amount,
        dueDate: toDateOnly(dueDate),
        notes,
        receiptUri,
      });

      toast("Loan saved");
      navigation.goBack();
    } catch (error) {
      toast(getErrorMessage(error), "error");
      setSaving(false);
    }
  };

  const clearError = (key: keyof LoanFormErrors) => {
    setErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInputField
          label="Friend's name"
          value={friendName}
          onChangeText={(value) => {
            setFriendName(value);
            clearError("friendName");
          }}
          placeholder="e.g. Rohan Mehta"
          error={errors.friendName}
          editable={!saving}
          maxLength={80}
        />

        <TextInputField
          label="Amount lent"
          prefix="₹"
          value={amount}
          onChangeText={(value) => {
            setAmount(value.replace(/[^0-9.]/g, ""));
            clearError("amount");
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={errors.amount}
          editable={!saving}
        />

        <View style={styles.dateWrap}>
          <Text style={styles.label}>Due date</Text>

          <Pressable
            onPress={() => setShowPicker((previous) => !previous)}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={
              dueDate
                ? `Due date ${formatDate(dueDate)}. Tap to change`
                : "Pick a due date"
            }
            style={[
              styles.dateField,
              !!errors.dueDate && { borderColor: colors.red },
            ]}
          >
            <Text
              style={
                dueDate
                  ? styles.dateText
                  : styles.datePlaceholder
              }
            >
              {dueDate ? formatDate(dueDate) : "Select a date"}
            </Text>
          </Pressable>

          {errors.dueDate ? (
            <Text style={styles.error}>{errors.dueDate}</Text>
          ) : null}

          {showPicker && Platform.OS === "web" ? (
            <input
              type="date"
              aria-label="Choose loan due date"
              value={dateToInputValue(dueDate)}
              min={todayString}
              disabled={saving}
              onChange={(event) =>
                onWebDateChange(event.currentTarget.value)
              }
              style={{
                width: "100%",
                minHeight: 50,
                marginTop: 8,
                padding: 12,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.md,
                backgroundColor: colors.white,
                color: colors.navy,
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
          ) : null}

          {showPicker && Platform.OS !== "web" ? (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onDateChange}
              minimumDate={new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              )}
              accentColor={colors.green}
            />
          ) : null}
        </View>

        <TextInputField
          label="Notes (optional)"
          value={notes}
          onChangeText={(value) => {
            setNotes(value);
            clearError("notes");
          }}
          placeholder="What was it for?"
          multiline
          error={errors.notes}
          editable={!saving}
          maxLength={500}
        />

        <View style={styles.dateWrap}>
          <Text style={styles.label}>Receipt photo (optional)</Text>

          {receiptUri ? (
            <View style={styles.receiptRow}>
              <Image
                source={{ uri: receiptUri }}
                style={styles.receipt}
                accessibilityLabel="Selected receipt"
              />

              <PrimaryButton
                title="Remove"
                variant="danger"
                onPress={() => setReceiptUri(null)}
                disabled={saving}
              />
            </View>
          ) : (
            <PrimaryButton
              title="Attach receipt"
              variant="outline"
              onPress={pickReceipt}
              disabled={saving}
            />
          )}
        </View>

        <PrimaryButton
          title={saving ? "Saving…" : "Save loan"}
          onPress={submit}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  label: {
    ...fonts.body,
    fontWeight: "600",
    marginBottom: 6,
  },
  dateWrap: {
    marginBottom: 16,
  },
  dateField: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 16,
    color: colors.navy,
  },
  datePlaceholder: {
    fontSize: 16,
    color: "#94A3B8",
  },
  error: {
    color: colors.red,
    fontSize: 13,
    marginTop: 4,
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  receipt: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
});
