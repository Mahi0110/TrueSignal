import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useApp } from "@/lib/AppContext";
import { collaborations, errorMessage } from "@/lib/api";
import type { Collaboration } from "@/lib/matching";
import { Button, Loading, Notice, Page, ui } from "@/components/ui";
export default function Collaborations() {
  const { session } = useApp();
  const [items, setItems] = useState<Collaboration[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(() => {
    let alive = true;
    if (session) {
      setLoading(true);
      collaborations()
        .then((data) => {
          if (alive) {
            setItems(data);
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
  }, [session?.user.id]);
  useFocusEffect(load);
  return (
    <Page
      title="Your collaborations."
      subtitle="Requests, shared briefs, conversations and Audience Share in one place."
    >
      <View style={ui.row}>
        <Button
          secondary
          label="Find creators"
          onPress={() => router.push("/discover")}
        />
        <Button
          secondary
          label="Refresh"
          onPress={() => {
            load();
          }}
        />
      </View>
      <Notice error text={error} />
      {loading ? (
        <Loading />
      ) : !session ? (
        <Button label="Sign in" onPress={() => router.push("/auth")} />
      ) : !items.length && !error ? (
        <View style={ui.card}>
          <Text style={ui.heading}>
            Every project starts with an invitation.
          </Text>
          <Text style={ui.body}>
            Send a brief to a creator whose interests and skills fit your idea.
          </Text>
        </View>
      ) : null}
      {items.map((c) => (
        <View style={ui.card} key={c.id}>
          <Text style={ui.eyebrow}>
            {c.status === "pending"
              ? c.recipient_id === session?.user.id
                ? "AWAITING YOUR RESPONSE"
                : "REQUEST SENT"
              : c.status.toUpperCase()}
          </Text>
          <Text style={ui.heading}>{c.title}</Text>
          <Text style={ui.body} numberOfLines={2}>
            {c.idea}
          </Text>
          <Button
            label="Open collaboration →"
            onPress={() =>
              router.push({
                pathname: "/collaboration/[id]",
                params: { id: c.id },
              })
            }
          />
        </View>
      ))}
    </Page>
  );
}
