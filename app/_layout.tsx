import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/theme";
import { AppProvider } from "@/lib/AppContext";
import { PurchaseProvider } from "@/lib/PurchaseContext";

export default function RootLayout() {
  return (
    <AppProvider>
      <PurchaseProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </PurchaseProvider>
    </AppProvider>
  );
}
