import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendOtp } from "../api/auth";
import { getErrorMessage } from "../api/client";
import { ErrorMessage } from "../components/ErrorMessage";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextInputField } from "../components/TextInputField";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, fonts } from "../theme";
import { validatePhone } from "../utils/validation";

export function PhoneScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Phone">) {
  const [phone, setPhone] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    const error = validatePhone(digits);
    setFieldError(error);
    setApiError(null);
    if (error) return;
    setLoading(true);
    try {
      await sendOtp(digits);
      navigation.navigate("Otp", { phone: digits });
    } catch (e) {
      setApiError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoText}>₹</Text>
          </View>
          <Text style={styles.title}>MiniLedger</Text>
          <Text style={styles.subtitle}>
            Keep track of money you've lent to friends — and get it back on time.
          </Text>

          <View style={{ marginTop: 32 }}>
            <TextInputField
              label="Mobile number"
              prefix="+91"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
              keyboardType="number-pad"
              placeholder="98765 43210"
              maxLength={10}
              error={fieldError}
              editable={!loading}
              onSubmitEditing={submit}
            />
            {apiError ? <ErrorMessage message={apiError} /> : null}
            <PrimaryButton title="Send OTP" onPress={submit} loading={loading} />
            <Text style={styles.hint}>
              Demo login: the OTP is printed in the API server console, not shown here.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 56 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoText: { color: colors.white, fontSize: 32, fontWeight: "800" },
  title: { ...fonts.title, fontSize: 32 },
  subtitle: { ...fonts.caption, fontSize: 15, marginTop: 8, lineHeight: 22 },
  hint: { ...fonts.caption, textAlign: "center", marginTop: 16 },
});
