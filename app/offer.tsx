import { router } from "expo-router";
import { Button, Page } from "@/components/ui";
import CreatorPass from "@/lib/CreatorPass";
export default function Offer() {
  return (
    <Page
      title="More tools for your creative work."
      subtitle="Discover your people and try collaborating first. Upgrade when the extra tools are useful to you."
    >
      <CreatorPass />
      <Button
        secondary
        label="Continue with free collaboration"
        onPress={() => router.replace("/discover")}
      />
    </Page>
  );
}
