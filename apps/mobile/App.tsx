import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "./src/components/Toast";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
