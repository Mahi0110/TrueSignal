import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button, Chips, Field, Notice, ui } from "./ui";
import { plans, rpc, errorMessage } from "@/lib/api";
import {
  validPostUrl,
  type AudiencePlan,
  type Collaboration,
} from "@/lib/matching";
export default function AudienceShare({
  collaboration: c,
  userId,
  senderName,
  recipientName,
  revision,
}: {
  collaboration: Collaboration;
  userId: string;
  senderName: string;
  recipientName: string;
  revision: number;
}) {
  const [items, setItems] = useState<AudiencePlan[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [post, setPost] = useState("");
  const [form, setForm] = useState({
    format: "Joint post",
    sender_channel: "",
    recipient_channel: "",
    sender_commitment: "",
    recipient_commitment: "",
    scheduled_for: new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 10),
  });
  const set = (key: keyof typeof form, value: string) =>
    setForm((v) => ({ ...v, [key]: value }));
  const current = items.find(
    (p) => p.status === "pending" || p.status === "accepted",
  );
  const isSender = userId === c.sender_id;
  async function load() {
    try {
      setItems(await plans(c.id));
      setLoaded(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  useEffect(() => {
    void load();
  }, [c.id, revision]);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setPost("");
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const dateValid =
    /^\d{4}-\d{2}-\d{2}$/.test(form.scheduled_for) &&
    Number.isFinite(Date.parse(form.scheduled_for)) &&
    new Date(form.scheduled_for).toISOString().slice(0, 10) ===
      form.scheduled_for;
  return (
    <View
      style={[ui.card, { borderColor: "#EDBF9E", backgroundColor: "#FFF5EC" }]}
    >
      <Text style={ui.eyebrow}>AUDIENCE SHARE</Text>
      <Text style={ui.heading}>
        Introduce your work to each other’s community.
      </Text>
      <Text style={ui.body}>
        Agree on a shout-out, joint post or guest feature. Both creators approve
        the plan, publish on their own channels, then add their post links here.
      </Text>
      <Notice error text={error} />
      {!loaded ? (
        <Notice text="Loading Audience Share…" />
      ) : current ? (
        <>
          <Text style={ui.eyebrow}>
            {current.status === "pending"
              ? "AWAITING AGREEMENT"
              : "PLAN ACCEPTED"}
          </Text>
          <Text style={ui.heading}>
            {current.format} · {current.scheduled_for}
          </Text>
          <Text style={ui.label}>
            {senderName} · {current.sender_channel}
          </Text>
          <Text style={ui.body}>{current.sender_commitment}</Text>
          <Text style={ui.label}>
            {recipientName} · {current.recipient_channel}
          </Text>
          <Text style={ui.body}>{current.recipient_commitment}</Text>
          {current.status === "pending" &&
            c.status === "accepted" &&
            (current.proposed_by !== userId ? (
              <View style={ui.row}>
                <Button
                  disabled={busy}
                  label="Accept Audience Share"
                  onPress={() =>
                    void act(() =>
                      rpc("respond_audience_share", {
                        target: current.id,
                        action: "accept",
                      }),
                    )
                  }
                />
                <Button
                  secondary
                  disabled={busy}
                  label="Decline plan"
                  onPress={() =>
                    void act(() =>
                      rpc("respond_audience_share", {
                        target: current.id,
                        action: "decline",
                      }),
                    )
                  }
                />
              </View>
            ) : (
              <Notice text="Your partner needs to accept. You cannot accept your own proposal." />
            ))}
          {current.status === "accepted" && (
            <>
              <Text style={ui.heading}>
                {Number(!!current.sender_post_url) +
                  Number(!!current.recipient_post_url)}
                /2 posts linked
              </Text>
              {[
                { name: senderName, url: current.sender_post_url },
                { name: recipientName, url: current.recipient_post_url },
              ].map((x, i) => (
                <View key={i} style={{ gap: 6 }}>
                  <Text style={ui.body}>
                    {x.name}:{" "}
                    {x.url ? "post link added" : "waiting for a post link"}
                  </Text>
                  {x.url && validPostUrl(x.url) && (
                    <Button
                      secondary
                      label={`Open ${x.name}'s post`}
                      onPress={() => {
                        void Linking.openURL(x.url!).catch((e) =>
                          setError(errorMessage(e)),
                        );
                      }}
                    />
                  )}
                </View>
              ))}
              <Notice text="Links are added by creators. TrueSignal does not verify impressions or promise audience growth." />
              {c.status === "accepted" && (
                <>
                  <Field
                    label={
                      isSender
                        ? "Your published post link (sender)"
                        : "Your published post link (recipient)"
                    }
                    value={post}
                    maxLength={2000}
                    onChangeText={setPost}
                    placeholder="https://…"
                  />
                  <Button
                    disabled={busy || !validPostUrl(post.trim())}
                    label={
                      (
                        isSender
                          ? current.sender_post_url
                          : current.recipient_post_url
                      )
                        ? "Update my post link"
                        : "Add my published post"
                    }
                    onPress={() =>
                      void act(() =>
                        rpc("record_audience_post", {
                          target: current.id,
                          post_url: post.trim(),
                        }),
                      )
                    }
                  />
                </>
              )}
            </>
          )}
          {c.status === "accepted" && (
            <Button
              secondary
              disabled={busy}
              label="Cancel this Audience Share plan"
              onPress={() =>
                void act(() =>
                  rpc("respond_audience_share", {
                    target: current.id,
                    action: "cancel",
                  }),
                )
              }
            />
          )}
        </>
      ) : c.status === "accepted" ? (
        <>
          <Text style={ui.label}>Choose how to share</Text>
          <Chips
            options={["Shout-out", "Joint post", "Guest feature"]}
            selected={[form.format]}
            onSelect={(v) => set("format", v)}
          />
          <Field
            label={`${senderName}'s channel / handle`}
            maxLength={160}
            value={form.sender_channel}
            onChangeText={(v) => set("sender_channel", v)}
            placeholder="Instagram · @handle"
          />
          <Field
            label={`${senderName}'s contribution`}
            value={form.sender_commitment}
            onChangeText={(v) => set("sender_commitment", v)}
            multiline
            placeholder="What will this creator share, and how will the other creator be credited?"
          />
          <Field
            label={`${recipientName}'s channel / handle`}
            maxLength={160}
            value={form.recipient_channel}
            onChangeText={(v) => set("recipient_channel", v)}
            placeholder="YouTube · @channel"
          />
          <Field
            label={`${recipientName}'s contribution`}
            value={form.recipient_commitment}
            onChangeText={(v) => set("recipient_commitment", v)}
            multiline
          />
          <Field
            label="Planned date (YYYY-MM-DD)"
            maxLength={10}
            value={form.scheduled_for}
            onChangeText={(v) => set("scheduled_for", v)}
          />
          <Button
            disabled={
              busy ||
              !dateValid ||
              form.sender_channel.trim().length < 2 ||
              form.recipient_channel.trim().length < 2 ||
              form.sender_commitment.trim().length < 3 ||
              form.recipient_commitment.trim().length < 3
            }
            label={busy ? "Saving…" : "Propose Audience Share"}
            onPress={() =>
              void act(() =>
                rpc("propose_audience_share", { target: c.id, plan: form }),
              )
            }
          />
        </>
      ) : (
        <Notice text="No active Audience Share plan." />
      )}
      {items
        .filter((p) => p.status === "declined" || p.status === "cancelled")
        .map((p) => (
          <Notice
            key={p.id}
            text={`${p.format} · ${p.scheduled_for} · ${p.status}`}
          />
        ))}
    </View>
  );
}
