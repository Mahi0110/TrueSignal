import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Field, Loading, Notice, Page, ui } from "@/components/ui";
import CreatorControls from "@/components/CreatorControls";
import { useApp } from "@/lib/AppContext";
import { db, createCollaboration, errorMessage } from "@/lib/api";
import { makeBrief, type Brief, type Profile } from "@/lib/matching";
export default function NewCollaboration() {
  const { creator } = useLocalSearchParams<{ creator: string }>();
  const { profile, session } = useApp();
  const [other, setOther] = useState<Profile | null>(null),
    [brief, setBrief] = useState<Brief | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    if (profile && creator) {
      db()
        .from("profiles")
        .select("*")
        .eq("id", creator)
        .single()
        .then(({ data, error }) => {
          if (!alive) return;
          if (error) setMessage("This creator is no longer available.");
          else {
            setOther(data);
            setBrief(makeBrief(profile, data));
          }
        });
    }
    return () => {
      alive = false;
    };
  }, [profile, creator]);
  async function send() {
    if (!brief || !other) return;
    setBusy(true);
    try {
      const id = await createCollaboration(other.id, brief);
      router.replace({ pathname: "/collaboration/[id]", params: { id } });
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const labels: Record<keyof Brief, string> = {
    title: "Project title",
    idea: "The idea",
    sender_role: "Your contribution",
    recipient_role: "Their proposed contribution",
    next_step: "First step together",
  };
  return (
    <Page
      title="Start with a small, clear idea."
      subtitle="Edit this suggested brief. Nothing is sent until you choose Send request."
    >
      <Notice error text={message} />
      {!session ? (
        <Button label="Sign in" onPress={() => router.push("/auth")} />
      ) : !profile?.is_onboarded ? (
        <Button
          label="Complete my profile"
          onPress={() => router.push("/profile")}
        />
      ) : !brief && !message ? (
        <Loading />
      ) : null}
      {brief && other && (
        <>
          <View style={ui.card}>
            <Text style={ui.eyebrow}>
              INVITING {other.display_name.toUpperCase()}
            </Text>
            {(Object.keys(labels) as (keyof Brief)[]).map((key) => (
              <Field
                key={key}
                label={labels[key]}
                maxLength={key === "title" ? 140 : key === "idea" ? 2000 : 1000}
                value={brief[key]}
                onChangeText={(v) => setBrief({ ...brief, [key]: v })}
                multiline={key !== "title"}
              />
            ))}
          </View>
          <Notice text="The recipient can accept or decline. Messages and Audience Share open after acceptance. Basic collaboration is free." />
          <Button
            disabled={
              busy || Object.values(brief).some((v) => v.trim().length < 3)
            }
            label={busy ? "Sending…" : "Send collaboration request"}
            onPress={() => void send()}
          />
          <CreatorControls
            id={other.id}
            onBlocked={() => router.replace("/discover")}
          />
        </>
      )}
    </Page>
  );
}
