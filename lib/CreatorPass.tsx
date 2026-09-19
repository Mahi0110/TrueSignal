import { Text, View, Platform } from "react-native";
import { Button, Notice, ui } from "@/components/ui";
import { usePurchases } from "./PurchaseContext";
import { formatPrice } from "./webBilling";
export default function CreatorPass() {
  const { active, webStatus, busy, message, open, manage } = usePurchases();
  const canManage = Platform.OS === "web" ? !!webStatus?.managed : active;
  const externalPass = Platform.OS === "web" && active && !canManage;
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Creator Pass</Text>
      <Text style={ui.body}>
        Filter creators by format and availability, and export collaboration
        briefs. Your Interest DNA, basic matching, requests, messages and
        Audience Share stay free.
      </Text>
      {Platform.OS === "web" && webStatus && (
        <View style={{ gap: 8 }}>
          <Text style={ui.label}>Your loyalty price</Text>
          <Text style={ui.body}>
            {webStatus.prices.map((price) => formatPrice(price, webStatus.currency)).join(" → ")}
          </Text>
          <Text style={ui.body}>Monthly prices, before any applicable tax. Each paid month earns 5 percentage points off the next renewal, up to 20%. The lowest price continues while your subscription stays open.</Text>
          {webStatus.managed && webStatus.renewsAt && (
            <Text style={ui.body}>
              {webStatus.cancelAtPeriodEnd ? "Access ends" : "Next renewal"}: {new Date(webStatus.renewsAt * 1000).toLocaleDateString()}
              {!webStatus.cancelAtPeriodEnd && webStatus.nextAmount !== null ? ` · ${formatPrice(webStatus.nextAmount, webStatus.currency)} before tax` : ""}
            </Text>
          )}
          <Text style={ui.body}>Cancel anytime. After your subscription expires, a new subscription starts at full price. Resuming before expiry keeps your loyalty discount.</Text>
        </View>
      )}
      <Text style={ui.eyebrow}>
        {active ? "PASS ACTIVE" : "OPTIONAL UPGRADE"}
      </Text>
      <Button
        disabled={busy || externalPass}
        label={
          busy
            ? "Connecting…"
            : canManage
              ? "Manage subscription"
              : externalPass ? "Pass active · manage in your purchase store" : "View plans and pricing"
        }
        onPress={() => void (canManage ? manage() : open())}
      />
      <Button
        secondary
        disabled={busy}
        label={Platform.OS === "web" ? "Refresh access" : "Restore purchases"}
        onPress={() => void open(true)}
      />
      <Notice
        text={
          message ||
          "The purchase screen shows the available price, billing period and terms before you confirm."
        }
      />
    </View>
  );
}
