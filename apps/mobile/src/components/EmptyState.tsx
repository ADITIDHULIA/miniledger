import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../theme";
import { PrimaryButton } from "./PrimaryButton";

interface Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="wallet-outline" size={32} color={colors.green} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? <PrimaryButton title={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", padding: 28, gap: 10 },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: fonts.heading,
  message: { ...fonts.caption, textAlign: "center", marginBottom: 8, lineHeight: 19 },
});
