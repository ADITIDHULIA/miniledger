import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";

export function LoadingIndicator({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  text: fonts.caption,
});
