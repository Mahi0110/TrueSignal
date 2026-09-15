import { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { router } from "expo-router";
import {
  AVAILABILITY,
  FORMATS,
  INTENTS,
  SKILLS,
  type Profile,
} from "@/lib/matching";
import { useApp } from "@/lib/AppContext";
import { db, errorMessage, rpc, saveProfile } from "@/lib/api";
import {
  Button,
  Chips,
  Field,
  Loading,
  Notice,
  Page,
  ui,
} from "@/components/ui";
export default function ProfileScreen() {
  const {
    session,
    loading,
    profile,
    draft,
    saveDraft,
    refresh,
    signOut,
    error,
  } = useApp();
  const [form, setForm] = useState<Profile>(draft),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [blocks, setBlocks] = useState<{ blocked_id: string }[]>([]);
  useEffect(() => {
    setForm(
      profile
        ? {
            ...profile,
            ...(draft.id === profile.id ? draft : {}),
            interest_names:
              draft.interest_names.length >= 3
                ? draft.interest_names
                : profile.interest_names,
            creator_type:
              draft.interest_names.length >= 3
                ? draft.creator_type
                : profile.creator_type,
          }
        : draft,
    );
  }, [profile, draft]);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((p) => ({ ...p, [key]: value }));
  const toggle = (key: "skill_names" | "desired_skills", value: string) =>
    set(
      key,
      form[key].includes(value)
        ? form[key].filter((x) => x !== value)
        : [...form[key], value],
    );
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await saveProfile(form);
      await saveDraft(form);
      await refresh();
      router.replace("/discover");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadBlocks() {
    try {
      const { data, error } = await db()
        .from("creator_blocks")
        .select("blocked_id");
      if (error) throw error;
      setBlocks(data || []);
      setMessage(data?.length ? "" : "You have no blocked accounts.");
    } catch (e) {
      setMessage(errorMessage(e));
    }
  }
  if (loading) return <Loading />;
  if (!session)
    return (
      <Page title="Save your creator profile">
        <Text style={ui.body}>
          Your selected interests are ready. Sign in to save them and connect
          with real creators.
        </Text>
        <Button
          label="Sign in / Create account"
          onPress={() => router.push("/auth")}
        />
      </Page>
    );
  return (
    <Page
      title="A little about your work."
      subtitle="Match through shared interests, useful skills and a clear reason to create together."
    >
      <Notice error text={error || message} />
      <Field
        label="Display name"
        maxLength={60}
        value={form.display_name}
        onChangeText={(v) => set("display_name", v)}
      />
      <Field
        label="Username"
        maxLength={30}
        value={form.username}
        onChangeText={(v) =>
          set("username", v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
        }
      />
      <View style={ui.card}>
        <Text style={ui.heading}>Your interests</Text>
        <Text style={ui.body}>
          {form.interest_names.join(" · ") || "Choose at least three niches."}
        </Text>
        <Button
          label="Explore the category circle"
          secondary
          onPress={() => {
            void saveDraft(form)
              .then(() => router.push("/onboarding"))
              .catch((e) => setMessage(errorMessage(e)));
          }}
        />
      </View>
      <Text style={ui.label}>What would you like to do?</Text>
      <Chips
        options={INTENTS}
        selected={[form.intent]}
        onSelect={(v) => set("intent", v)}
      />
      <Text style={ui.label}>Skills you bring</Text>
      <Chips
        options={SKILLS}
        selected={form.skill_names}
        onSelect={(v) => toggle("skill_names", v)}
      />
      <Text style={ui.label}>Skills you are looking for (optional)</Text>
      <Chips
        options={SKILLS}
        selected={form.desired_skills}
        onSelect={(v) => toggle("desired_skills", v)}
      />
      <Text style={ui.label}>Preferred format</Text>
      <Chips
        options={FORMATS}
        selected={[form.preferred_format]}
        onSelect={(v) => set("preferred_format", v)}
      />
      <Text style={ui.label}>Availability</Text>
      <Chips
        options={AVAILABILITY}
        selected={[form.availability]}
        onSelect={(v) => set("availability", v)}
      />
      <Field
        label="What are you hoping to make?"
        maxLength={500}
        value={form.creative_goal}
        onChangeText={(v) => set("creative_goal", v)}
        multiline
      />
      <Field
        label="Bio (optional)"
        maxLength={500}
        value={form.bio}
        onChangeText={(v) => set("bio", v)}
        multiline
      />
      <View style={ui.row}>
        <Switch
          accessibilityLabel="Show my profile in discovery"
          value={form.discoverable}
          onValueChange={(v) => set("discoverable", v)}
        />
        <Text style={ui.body}>Show my profile in discovery</Text>
      </View>
      <Button
        label={busy ? "Saving…" : "Save profile and find creators"}
        disabled={
          busy ||
          form.interest_names.length < 3 ||
          form.skill_names.length === 0
        }
        onPress={() => void save()}
      />
      <Button
        secondary
        label="Manage blocked accounts"
        onPress={() => void loadBlocks()}
      />
      {blocks.map((b) => (
        <View key={b.blocked_id} style={ui.card}>
          <Text style={ui.note}>
            Blocked account {b.blocked_id.slice(0, 8)}
          </Text>
          <Button
            secondary
            label="Unblock account"
            onPress={() => {
              void rpc("unblock_creator", { target: b.blocked_id })
                .then(loadBlocks)
                .catch((e) => setMessage(errorMessage(e)));
            }}
          />
        </View>
      ))}
      <Button
        secondary
        label="Sign out"
        onPress={() => {
          void signOut()
            .then(() => router.replace("/"))
            .catch((e) => setMessage(errorMessage(e)));
        }}
      />
    </Page>
  );
}
