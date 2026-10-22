import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import { PrimaryButton } from "./PrimaryButton";

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
      {onRetry ? <PrimaryButton title="Try again" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.redSoft, borderRadius: radius.md, padding: 16, gap: 12, marginVertical: 12 },
  text: { color: colors.red, fontSize: 14, fontWeight: "600" },
});
