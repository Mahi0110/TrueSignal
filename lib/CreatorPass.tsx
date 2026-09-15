import { Text, View } from "react-native";
import { Button, Notice, ui } from "@/components/ui";
import { usePurchases } from "./PurchaseContext";
export default function CreatorPass() {
  const { active, busy, message, open, manage } = usePurchases();
  return (
    <View style={ui.card}>
      <Text style={ui.heading}>Creator Pass</Text>
      <Text style={ui.body}>
        Filter creators by format and availability, and export collaboration
        briefs. Your Interest DNA, basic matching, requests, messages and
        Audience Share stay free.
      </Text>
      <Text style={ui.eyebrow}>
        {active ? "PASS ACTIVE" : "OPTIONAL UPGRADE"}
      </Text>
      <Button
        disabled={busy}
        label={
          busy
            ? "Connecting…"
            : active
              ? "Manage subscription"
              : "View plans and pricing"
        }
        onPress={() => void (active ? manage() : open())}
      />
      <Button
        secondary
        disabled={busy}
        label="Restore purchases"
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
