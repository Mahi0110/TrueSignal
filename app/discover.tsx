import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Button, Chips, Loading, Notice, Page, ui } from "@/components/ui";
import { useApp } from "@/lib/AppContext";
import { usePurchases } from "@/lib/PurchaseContext";
import { profiles, errorMessage } from "@/lib/api";
import { recommend, FORMATS, AVAILABILITY, type Profile } from "@/lib/matching";
import { shareDna } from "@/lib/sharing";
export default function Discover() {
  const { session, profile, loading: authLoading } = useApp();
  const { active } = usePurchases();
  const params = useLocalSearchParams<{ interest?: string }>();
  const [all, setAll] = useState<Profile[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [format, setFormat] = useState(""),
    [availability, setAvailability] = useState("");
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (session) {
        setLoading(true);
        profiles()
          .then((data) => {
            if (alive) {
              setAll(data);
              setError("");
            }
          })
          .catch((e) => {
            if (alive) setError(errorMessage(e));
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
      }
      return () => {
        alive = false;
      };
    }, [session?.user.id]),
  );
  const matches = profile
    ? recommend(profile, all, params.interest).filter(
        (m) =>
          !active ||
          ((!format || m.profile.preferred_format === format) &&
            (!availability || m.profile.availability === availability)),
      )
    : [];
  return (
    <Page
      title="Find your next collaborator."
      subtitle="Shared curiosity. Complementary skills. A clear reason to create together."
    >
      <View style={ui.row}>
        <Button secondary label="My DNA" onPress={() => router.push("/dna")} />
        <Button
          secondary
          label="Collaborations"
          onPress={() => router.push("/collaborations")}
        />
        <Button
          secondary
          label="My profile"
          onPress={() => router.push("/profile")}
        />
      </View>
      {authLoading || loading ? (
        <Loading />
      ) : !session ? (
        <View style={ui.card}>
          <Text style={ui.heading}>Meet real creators.</Text>
          <Text style={ui.body}>
            Sign in to see people who have chosen to make their profiles
            discoverable.
          </Text>
          <Button
            label="Sign in / Create account"
            onPress={() => router.push("/auth")}
          />
        </View>
      ) : !profile?.is_onboarded ? (
        <View style={ui.card}>
          <Text style={ui.body}>
            Add your interests, skills and collaboration goal to get useful
            suggestions.
          </Text>
          <Button
            label="Complete my profile"
            onPress={() => router.push("/profile")}
          />
        </View>
      ) : (
        <>
          {!!params.interest && (
            <View style={ui.row}>
              <Text style={ui.body}>Exploring {params.interest}</Text>
              <Button
                secondary
                label="All my interests"
                onPress={() => router.replace("/discover")}
              />
            </View>
          )}
          {active ? (
            <View style={ui.card}>
              <Text style={ui.eyebrow}>CREATOR PASS FILTERS</Text>
              <Chips
                options={["Any format", ...FORMATS]}
                selected={[format || "Any format"]}
                onSelect={(v) => setFormat(v === "Any format" ? "" : v)}
              />
              <Chips
                options={["Any availability", ...AVAILABILITY]}
                selected={[availability || "Any availability"]}
                onSelect={(v) =>
                  setAvailability(v === "Any availability" ? "" : v)
                }
              />
            </View>
          ) : (
            <Button
              secondary
              label="Explore optional Creator Pass filters"
              onPress={() => router.push("/offer")}
            />
          )}
          <Notice error text={error} />
          {!error && matches.length === 0 && (
            <View style={ui.card}>
              <Text style={ui.heading}>Your circle is still growing.</Text>
              <Text style={ui.body}>
                There are no matching discoverable creators for these selections
                yet. Try another niche or invite a creator to join.
              </Text>
              <Button
                secondary
                label="Explore more niches"
                onPress={() => router.push("/onboarding")}
              />
              <Button
                label="Share my DNA and invite a creator"
                onPress={() => {
                  void shareDna(profile).catch((e) =>
                    setError(errorMessage(e)),
                  );
                }}
              />
            </View>
          )}
          {matches.map((m) => (
            <View style={ui.card} key={m.profile.id}>
              <View style={ui.row}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 17,
                    backgroundColor: "#E9DDFF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={ui.heading}>
                    {m.profile.display_name.slice(0, 1)}
                  </Text>
                </View>
                <View>
                  <Text style={ui.heading}>{m.profile.display_name}</Text>
                  <Text style={ui.note}>
                    @{m.profile.username} · {m.profile.creator_type}
                  </Text>
                </View>
              </View>
              {!!m.profile.creative_goal && (
                <Text style={ui.body}>{m.profile.creative_goal}</Text>
              )}
              <Text style={ui.eyebrow}>WHY YOU COULD CREATE TOGETHER</Text>
              {m.reasons.map((r) => (
                <Text key={r} style={ui.body}>
                  • {r}
                </Text>
              ))}
              <Text style={ui.note}>
                {m.profile.intent} · {m.profile.availability}
              </Text>
              <Button
                label={
                  m.profile.intent === "Audience Share"
                    ? "Plan an Audience Share collaboration"
                    : "Start a collaboration →"
                }
                onPress={() =>
                  router.push({
                    pathname: "/collaboration/new",
                    params: { creator: m.profile.id },
                  })
                }
              />
            </View>
          ))}
          {!!error && (
            <Button
              secondary
              label="Try again"
              onPress={() => router.replace("/discover")}
            />
          )}
        </>
      )}
    </Page>
  );
}
