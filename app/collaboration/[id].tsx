import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Button, Field, Loading, Notice, Page, ui } from "@/components/ui";
import AudienceShare from "@/components/AudienceShare";
import CreatorControls from "@/components/CreatorControls";
import { useApp } from "@/lib/AppContext";
import { usePurchases } from "@/lib/PurchaseContext";
import { db, rpc, changeCollaboration, errorMessage } from "@/lib/api";
import type { Collaboration } from "@/lib/matching";
import { shareBrief } from "@/lib/sharing";
type Message = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};
export default function Workspace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useApp();
  const { active } = usePurchases();
  const [c, setC] = useState<Collaboration | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState(""),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  async function load() {
    try {
      const { data, error } = await db()
        .from("collaborations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error("This collaboration is no longer available.");
      setC(data);
      const [p, m] = await Promise.all([
        db()
          .from("profiles")
          .select("id,display_name")
          .in("id", [data.sender_id, data.recipient_id]),
        db()
          .from("collaboration_messages")
          .select("*")
          .eq("collaboration_id", id)
          .order("created_at"),
      ]);
      if (p.error) throw p.error;
      if (m.error) throw m.error;
      setNames(
        Object.fromEntries((p.data || []).map((p) => [p.id, p.display_name])),
      );
      setMessages(m.data || []);
      setRevision((v) => v + 1);
    } catch (e) {
      setError(errorMessage(e));
      setC(null);
    }
  }
  useFocusEffect(
    useCallback(() => {
      if (session && id) void load();
    }, [id, session?.user.id]),
  );
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setText("");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const sender = names[c?.sender_id || ""] || "Sending creator",
    recipient = names[c?.recipient_id || ""] || "Invited creator";
  return (
    <Page
      title={c?.title || "Collaboration workspace"}
      subtitle={c ? `${sender} × ${recipient}` : undefined}
    >
      <View style={ui.row}>
        <Button
          secondary
          label="All collaborations"
          onPress={() => router.replace("/collaborations")}
        />
        <Button
          secondary
          label="Refresh workspace"
          disabled={busy}
          onPress={() => {
            setError("");
            void load();
          }}
        />
      </View>
      <Notice error text={error} />
      {!session ? (
        <Button label="Sign in" onPress={() => router.push("/auth")} />
      ) : !c && !error ? (
        <Loading />
      ) : null}
      {c && session && (
        <>
          <Text style={ui.eyebrow}>{c.status.toUpperCase()}</Text>
          <View style={ui.card}>
            <Text style={ui.heading}>The shared brief</Text>
            <Text style={ui.body}>{c.idea}</Text>
            <Text style={ui.label}>Contributions</Text>
            <Text style={ui.body}>{c.sender_role}</Text>
            <Text style={ui.body}>{c.recipient_role}</Text>
            <Text style={ui.label}>Next step</Text>
            <Text style={ui.body}>{c.next_step}</Text>
            <Button
              secondary
              label={active ? "Export brief" : "Export brief · Creator Pass"}
              disabled={busy}
              onPress={() => {
                if (active)
                  void shareBrief(c).catch((e) => setError(errorMessage(e)));
                else router.push("/offer");
              }}
            />
          </View>
          {c.status === "pending" &&
            (session.user.id === c.recipient_id ? (
              <View style={ui.row}>
                <Button
                  disabled={busy}
                  label="Accept collaboration"
                  onPress={() =>
                    void act(() => changeCollaboration(c.id, "accept"))
                  }
                />
                <Button
                  secondary
                  disabled={busy}
                  label="Decline request"
                  onPress={() =>
                    void act(() => changeCollaboration(c.id, "decline"))
                  }
                />
              </View>
            ) : (
              <>
                <Notice text="Your request has been sent. Messages open when the other creator accepts." />
                <Button
                  secondary
                  disabled={busy}
                  label="Cancel request"
                  onPress={() =>
                    void act(() => changeCollaboration(c.id, "cancel"))
                  }
                />
              </>
            ))}
          {(c.status === "accepted" || c.status === "completed") && (
            <>
              <View style={ui.card}>
                <Text style={ui.heading}>Conversation</Text>
                {!messages.length && (
                  <Text style={ui.body}>
                    Start by agreeing on your first small step.
                  </Text>
                )}
                {messages.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      backgroundColor:
                        m.author_id === session.user.id ? "#F0E8FF" : "#FFF2E8",
                      padding: 14,
                      borderRadius: 16,
                      gap: 5,
                    }}
                  >
                    <Text style={ui.label}>
                      {names[m.author_id] || "Creator"}
                    </Text>
                    <Text style={ui.body}>{m.body}</Text>
                    <Text style={ui.note}>
                      {new Date(m.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
                {c.status === "accepted" && (
                  <>
                    <Field
                      label="Your message"
                      value={text}
                      maxLength={2000}
                      onChangeText={setText}
                      multiline
                    />
                    <Button
                      disabled={busy || !text.trim()}
                      label={busy ? "Saving…" : "Send message"}
                      onPress={() =>
                        void act(() =>
                          rpc("send_collaboration_message", {
                            target: c.id,
                            message: text.trim(),
                          }),
                        )
                      }
                    />
                  </>
                )}
              </View>
              <AudienceShare
                collaboration={c}
                userId={session.user.id}
                senderName={sender}
                recipientName={recipient}
                revision={revision}
              />
              {c.status === "accepted" && (
                <View style={ui.card}>
                  <Text style={ui.heading}>Made something together?</Text>
                  <Text style={ui.body}>
                    Mark this collaboration complete when the work is finished.
                    This closes messages and Audience Share updates.
                  </Text>
                  <Button
                    secondary
                    disabled={busy}
                    label="Mark collaboration complete"
                    onPress={() =>
                      void act(() => changeCollaboration(c.id, "complete"))
                    }
                  />
                </View>
              )}
            </>
          )}
          <CreatorControls
            id={c.sender_id === session.user.id ? c.recipient_id : c.sender_id}
            onBlocked={() => router.replace("/collaborations")}
          />
        </>
      )}
    </Page>
  );
}
