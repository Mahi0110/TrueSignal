import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import InterestCircle from "@/components/InterestCircle";
import { Button, Notice, Page, ui } from "@/components/ui";
import { useApp } from "@/lib/AppContext";
import { shareDna } from "@/lib/sharing";
import { errorMessage } from "@/lib/api";
export default function Dna() {
  const { draft, profile, session } = useApp();
  const p = draft.interest_names.length ? draft : profile;
  const [focused, setFocused] = useState(""),
    [message, setMessage] = useState(""),
    [page, setPage] = useState(0);
  if (!p?.interest_names.length)
    return (
      <Page title="Your map starts with curiosity.">
        <Button
          label="Explore the category circle"
          onPress={() => router.replace("/onboarding")}
        />
      </Page>
    );
  const selected = p.interest_names,
    interest = focused || selected[0];
  return (
    <Page
      title="Your interests, connected."
      subtitle="A map of what you chose. Tap a niche to find creators who share it."
    >
      <View style={[ui.card, { padding: 10 }]}>
        <InterestCircle
          nodes={selected
            .slice(page * 8, page * 8 + 8)
            .map((x) => ({ key: x, label: x, selected: interest === x }))}
          center="Your DNA"
          caption={`${selected.length} niches`}
          onSelect={setFocused}
        />
      </View>
      {selected.length > 8 && (
        <Button
          secondary
          label={page ? "← First niches" : "More selected niches →"}
          onPress={() => setPage(page ? 0 : 1)}
        />
      )}
      <View style={ui.card}>
        <Text style={ui.eyebrow}>EXPLORE THIS CONNECTION</Text>
        <Text style={ui.heading}>{interest}</Text>
        <Text style={ui.body}>
          Look for shared curiosity and complementary skills. Your selections
          shape the suggestions; this map does not measure personality or
          compatibility.
        </Text>
        <Button
          label={`Find creators in ${interest}`}
          onPress={() =>
            router.push({ pathname: "/discover", params: { interest } })
          }
        />
        <Button
          secondary
          label="Explore adjacent niches"
          onPress={() =>
            router.push({ pathname: "/explore", params: { seed: interest } })
          }
        />
      </View>
      <View style={[ui.card, ui.dark]}>
        <Text style={[ui.eyebrow, { color: "#FFAB7A" }]}>
          YOUR SHAREABLE DNA
        </Text>
        <Text style={[ui.heading, { color: "#FFF", lineHeight: 31 }]}>
          {selected.join(" × ")}
        </Text>
        <Text style={[ui.body, { color: "#DED0F4" }]}>
          Made for small creators. Open to {p.intent.toLowerCase()}.
        </Text>
        <Button
          label="Share my DNA"
          onPress={() => {
            void shareDna(p).catch((e) => setMessage(errorMessage(e)));
          }}
        />
        <Notice text="Shares only your chosen niches, collaboration goal and an invitation link when available. You choose where to send it." />
      </View>
      <Notice text={message} />
      <Button
        label={
          session
            ? "Save my profile and meet creators"
            : "Save my DNA and meet creators"
        }
        onPress={() => router.push(session ? "/profile" : "/auth")}
      />
      <Button
        secondary
        label="Edit my category circle"
        onPress={() => router.push("/onboarding")}
      />
    </Page>
  );
}
