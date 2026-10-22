import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendOtp, verifyOtp } from "../api/auth";
import { getErrorMessage } from "../api/client";
import { ErrorMessage } from "../components/ErrorMessage";
import { PrimaryButton } from "../components/PrimaryButton";
import { TextInputField } from "../components/TextInputField";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, fonts } from "../theme";
import { validateOtp } from "../utils/validation";

const RESEND_SECONDS = 30;

export function OtpScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Otp">) {
  const { phone } = route.params;
  const { signIn } = useAuth();
  const toast = useToast();
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async () => {
    const error = validateOtp(otp);
    setFieldError(error);
    setApiError(null);
    if (error) return;
    setVerifying(true);
    try {
      const { token, user } = await verifyOtp(phone, otp);
      await signIn(token, user); // navigator switches to the dashboard automatically
    } catch (e) {
      setApiError(getErrorMessage(e));
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setApiError(null);
    try {
      const res = await sendOtp(phone);
      setCooldown(res.resendAfterSeconds);
      setOtp("");
      toast("A new OTP was sent");
    } catch (e) {
      setApiError(getErrorMessage(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={fonts.title}>Enter the OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to +91 {phone}. In this demo, look for it in the API server console.
          </Text>

          <TextInputField
            label="6-digit OTP"
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={6}
            placeholder="••••••"
            error={fieldError}
            editable={!verifying}
            autoFocus
            onSubmitEditing={verify}
          />
          {apiError ? <ErrorMessage message={apiError} /> : null}
          <PrimaryButton title="Verify & continue" onPress={verify} loading={verifying} />
          <Text style={styles.resendRow}>
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Didn't get the code?"}
          </Text>
          <PrimaryButton
            title="Resend OTP"
            variant="outline"
            onPress={resend}
            loading={resending}
            disabled={cooldown > 0 || verifying}
          />
          <PrimaryButton
            title="Change number"
            variant="outline"
            onPress={() => navigation.goBack()}
            disabled={verifying}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 12 },
  subtitle: { ...fonts.caption, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  resendRow: { ...fonts.caption, textAlign: "center", marginTop: 8 },
});
