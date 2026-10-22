import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { useAuth } from "../context/AuthContext";
import { AddLoanScreen } from "../screens/AddLoanScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { LoanDetailScreen } from "../screens/LoanDetailScreen";
import { LoansScreen } from "../screens/LoansScreen";
import { OtpScreen } from "../screens/OtpScreen";
import { PhoneScreen } from "../screens/PhoneScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  Phone: undefined;
  Otp: { phone: string };
  Dashboard: undefined;
  AddLoan: undefined;
  Loans: { initialFilter?: "all" | "pending" | "overdue" | "repaid" } | undefined;
  LoanDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.green },
};
const header = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerTintColor: colors.navy,
};

export function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingIndicator label="Restoring your session…" />;

  return (
    <NavigationContainer theme={theme}>
      {/* Protected navigation: the stack is chosen by auth state, so logged-out users can never reach app screens. */}
      <Stack.Navigator screenOptions={header}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddLoan" component={AddLoanScreen} options={{ title: "Add loan" }} />
            <Stack.Screen name="Loans" component={LoansScreen} options={{ title: "All loans" }} />
            <Stack.Screen
              name="LoanDetail"
              component={LoanDetailScreen}
              options={{ title: "Loan details" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Phone" component={PhoneScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Otp" component={OtpScreen} options={{ title: "Verify" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
