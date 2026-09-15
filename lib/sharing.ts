import { Share } from "react-native";
import type { Profile, Brief } from "./matching";
export function invitationUrl() {
  const raw = process.env.EXPO_PUBLIC_APP_URL;
  try {
    const u = new URL(raw || "");
    return u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}
export async function shareDna(profile: Profile) {
  const link = invitationUrl();
  await Share.share({
    title: "My TrueSignal Interest DNA",
    message: `My Interest DNA: ${profile.interest_names.join(" × ")}\nI’m interested in ${profile.intent.toLowerCase()}.\nLet’s make something together on TrueSignal.${link ? `\n${link}` : ""}`,
  });
}
export async function shareBrief(brief: Brief) {
  await Share.share({
    title: brief.title,
    message: `${brief.title}\n\n${brief.idea}\n\nContributions\n${brief.sender_role}\n${brief.recipient_role}\n\nNext step\n${brief.next_step}`,
  });
}
