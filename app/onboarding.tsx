import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { CATEGORIES, CREATOR_ROLES, NICHES } from "@/constants/interests";
import InterestCircle from "@/components/InterestCircle";
import { Button, Chips, Field, Notice, Page, ui } from "@/components/ui";
import { useApp } from "@/lib/AppContext";
import { cleanList } from "@/lib/matching";
import { errorMessage } from "@/lib/api";
export default function Onboarding() {
  const { draft, profile, saveDraft } = useApp();
  const [selected, setSelected] = useState<string[]>([]),
    [category, setCategory] = useState(""),
    [query, setQuery] = useState(""),
    [custom, setCustom] = useState("");
  const [role, setRole] = useState("Creator"),
    [page, setPage] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setSelected(
      draft.interest_names.length
        ? draft.interest_names
        : profile?.interest_names || [],
    );
    setRole(draft.creator_type || profile?.creator_type || "Creator");
  }, [draft, profile]);
  const niches = useMemo(
    () =>
      NICHES.filter((n) =>
        query.trim()
          ? n.name.toLowerCase().includes(query.trim().toLowerCase())
          : n.category === category,
      ),
    [query, category],
  );
  const showingNiches = !!category || !!query.trim();
  const pages = Math.ceil(niches.length / 8);
  const visible = niches.slice(page * 8, page * 8 + 8);
  const toggle = (name: string) => {
    setMessage("");
    if (selected.includes(name))
      setSelected((v) => v.filter((x) => x !== name));
    else if (selected.length < 10) setSelected((v) => cleanList([...v, name]));
    else setMessage("You have 10 niches. Remove one to make room for another.");
  };
  const add = () => {
    const name = custom.trim();
    if (!name) return;
    if (selected.length >= 10) {
      setMessage("Remove a niche before adding another.");
      return;
    }
    setSelected((v) => cleanList([...v, name]));
    setCustom("");
    setMessage("Your custom niche is selected.");
  };
  async function next() {
    setBusy(true);
    try {
      await saveDraft({
        ...draft,
        interest_names: selected,
        creator_type: role,
      });
      router.push("/dna");
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Follow what pulls you in."
      subtitle="Tap a category, then choose its niches. Start with three. You can explore up to ten."
    >
      <Text style={ui.eyebrow}>
        YOUR CREATIVE UNIVERSE · {selected.length}/10 SELECTED
      </Text>
      <View style={[ui.card, { padding: 10 }]}>
        <InterestCircle
          category={!showingNiches}
          center={
            showingNiches
              ? query.trim()
                ? "Search"
                : category
              : "Your interests"
          }
          caption={showingNiches ? "← Categories" : "Tap a category"}
          onCenter={
            showingNiches
              ? () => {
                  setCategory("");
                  setQuery("");
                  setPage(0);
                }
              : undefined
          }
          nodes={
            showingNiches
              ? visible.map((n) => ({
                  key: n.name,
                  label: n.name,
                  selected: selected.includes(n.name),
                }))
              : CATEGORIES.map((c) => ({
                  key: c,
                  label: c,
                  count: selected.filter((x) =>
                    NICHES.some((n) => n.name === x && n.category === c),
                  ).length,
                }))
          }
          onSelect={(key) =>
            showingNiches ? toggle(key) : (setCategory(key), setPage(0))
          }
        />
        {showingNiches && niches.length === 0 && (
          <Text style={[ui.body, { textAlign: "center" }]}>
            No niche found. Add your own below.
          </Text>
        )}
        {showingNiches && pages > 1 && (
          <View style={[ui.row, { justifyContent: "center" }]}>
            <Button
              secondary
              label="← Previous niches"
              disabled={page === 0}
              onPress={() => setPage((v) => v - 1)}
            />
            <Text style={ui.note}>
              {page + 1}/{pages}
            </Text>
            <Button
              secondary
              label="More niches →"
              disabled={page >= pages - 1}
              onPress={() => setPage((v) => v + 1)}
            />
          </View>
        )}
      </View>
      <Notice text={message} />
      {selected.length > 0 && (
        <View style={ui.card}>
          <Text style={ui.label}>Your selected niches · tap to remove</Text>
          <Chips options={selected} selected={selected} onSelect={toggle} />
        </View>
      )}
      <Button
        label={
          busy
            ? "Saving…"
            : selected.length >= 3
              ? "Reveal my Interest DNA →"
              : `Choose ${3 - selected.length} more niches`
        }
        disabled={busy || selected.length < 3}
        onPress={() => void next()}
      />
      <Field
        label="Jump to a niche"
        value={query}
        maxLength={80}
        onChangeText={(v) => {
          setQuery(v);
          setPage(0);
        }}
        placeholder="Search poetry, animation, robotics…"
      />
      <View style={ui.card}>
        <Field
          label="Your own niche"
          value={custom}
          maxLength={80}
          onChangeText={setCustom}
          placeholder="Something uniquely you"
        />
        <Button
          secondary
          label="Add custom niche +"
          disabled={!custom.trim()}
          onPress={add}
        />
      </View>
      <Text style={ui.label}>How do you create?</Text>
      <Chips options={CREATOR_ROLES} selected={[role]} onSelect={setRole} />
    </Page>
  );
}
