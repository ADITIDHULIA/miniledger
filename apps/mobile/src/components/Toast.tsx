import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

type ToastType = "success" | "error";
const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => undefined);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.wrap}>
          <View
            style={[
              styles.toast,
              { backgroundColor: toast.type === "success" ? colors.greenDark : colors.red },
            ]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, bottom: 40, alignItems: "center" },
  toast: { borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 18, maxWidth: "100%" },
  text: { color: colors.white, fontWeight: "600" },
});
