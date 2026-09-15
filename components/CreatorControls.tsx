import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Field, Notice, ui } from "./ui";
import { rpc, errorMessage } from "@/lib/api";
export default function CreatorControls({
  id,
  onBlocked,
}: {
  id: string;
  onBlocked: () => void;
}) {
  const [mode, setMode] = useState(""),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function act() {
    setBusy(true);
    try {
      await rpc(
        mode === "block" ? "block_creator" : "report_creator",
        mode === "block" ? { target: id } : { target: id, reason },
      );
      if (mode === "block") onBlocked();
      else {
        setMessage("Report saved for review. You can also block this creator.");
        setMode("");
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={ui.row}>
        <Button secondary label="Block" onPress={() => setMode("block")} />
        <Button secondary label="Report" onPress={() => setMode("report")} />
      </View>
      {mode && (
        <View style={ui.card}>
          <Text style={ui.body}>
            {mode === "block"
              ? "Hide this creator and stop their requests and messages? Your open collaboration will be cancelled."
              : "Tell us what happened. Reports are private."}
          </Text>
          {mode === "report" && (
            <Field
              label="Report reason"
              value={reason}
              onChangeText={setReason}
              multiline
            />
          )}
          <Button
            disabled={busy || (mode === "report" && reason.trim().length < 3)}
            label={
              busy
                ? "Saving…"
                : mode === "block"
                  ? "Confirm block"
                  : "Submit report"
            }
            onPress={() => void act()}
          />
          <Button
            secondary
            label="Cancel"
            disabled={busy}
            onPress={() => setMode("")}
          />
        </View>
      )}
      <Notice text={message} />
    </View>
  );
}
