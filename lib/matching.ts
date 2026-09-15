export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  creator_type: string;
  creative_goal: string;
  interest_names: string[];
  skill_names: string[];
  desired_skills: string[];
  intent: string;
  preferred_format: string;
  availability: string;
  discoverable: boolean;
  is_onboarded: boolean;
};
export type Brief = {
  title: string;
  idea: string;
  sender_role: string;
  recipient_role: string;
  next_step: string;
};
export type Collaboration = Brief & {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};
export type AudiencePlan = {
  id: string;
  collaboration_id: string;
  proposed_by: string;
  format: string;
  sender_channel: string;
  recipient_channel: string;
  sender_commitment: string;
  recipient_commitment: string;
  scheduled_for: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  sender_post_url: string | null;
  recipient_post_url: string | null;
};
export const INTENTS = [
  "Co-create content",
  "Exchange feedback",
  "Guest appearance",
  "Accountability",
  "Audience Share",
];
export const FORMATS = [
  "Short video",
  "Illustrated post",
  "Podcast",
  "Article",
  "Interactive project",
];
export const AVAILABILITY = ["This week", "Next week", "Flexible"];
export const SKILLS = [
  "Writing",
  "Illustration",
  "Video editing",
  "Animation",
  "Coding",
  "Photography",
  "Music",
  "Research",
  "Design",
  "Presenting",
];
export const blankProfile: Profile = {
  id: "",
  username: "",
  display_name: "",
  bio: "",
  creator_type: "Creator",
  creative_goal: "",
  interest_names: [],
  skill_names: [],
  desired_skills: [],
  intent: INTENTS[0],
  preferred_format: FORMATS[0],
  availability: "Flexible",
  discoverable: true,
  is_onboarded: false,
};
export const cleanList = (items: string[]): string[] =>
  Array.from(
    new Map(
      items
        .map((x) => [x.trim().toLowerCase(), x.trim()] as const)
        .filter((x) => x[0]),
    ).values(),
  );
const overlap = (a: string[], b: string[]) =>
  a.filter((x) => b.some((y) => x.toLowerCase() === y.toLowerCase()));
export function matchProfile(me: Profile, other: Profile) {
  const shared = overlap(me.interest_names, other.interest_names);
  const gives = overlap(me.desired_skills, other.skill_names);
  const needs = overlap(me.skill_names, other.desired_skills);
  const reasons: string[] = [];
  if (shared.length)
    reasons.push(`You both explore ${shared.slice(0, 3).join(", ")}.`);
  if (gives.length)
    reasons.push(
      `${other.display_name} offers the ${gives.join(", ")} skills you are looking for.`,
    );
  if (needs.length)
    reasons.push(`Your ${needs.join(", ")} skills fit what they need.`);
  if (me.intent === other.intent)
    reasons.push(`You both want to ${me.intent.toLowerCase()}.`);
  if (me.preferred_format === other.preferred_format)
    reasons.push(`You both prefer ${me.preferred_format.toLowerCase()}.`);
  const timing =
    me.availability === other.availability ||
    me.availability === "Flexible" ||
    other.availability === "Flexible";
  if (timing) reasons.push("Your availability overlaps.");
  // Ranking is a heuristic, never presented as a compatibility probability.
  const score =
    shared.length * 4 +
    gives.length * 3 +
    needs.length * 3 +
    Number(me.intent === other.intent) * 2 +
    Number(me.preferred_format === other.preferred_format) +
    Number(timing);
  return {
    profile: other,
    shared,
    gives,
    needs,
    reasons,
    score,
    relevant: shared.length + gives.length + needs.length > 0,
  };
}
export function recommend(me: Profile, profiles: Profile[], interest = "") {
  return profiles
    .filter((p) => p.id !== me.id && p.discoverable && p.is_onboarded)
    .filter(
      (p) =>
        !interest ||
        p.interest_names.some(
          (x) => x.toLowerCase() === interest.toLowerCase(),
        ),
    )
    .map((p) => matchProfile(me, p))
    .filter((m) => m.relevant)
    .sort(
      (a, b) => b.score - a.score || a.profile.id.localeCompare(b.profile.id),
    );
}
export function makeBrief(me: Profile, other: Profile): Brief {
  const shared = overlap(me.interest_names, other.interest_names);
  const topic =
    shared[0] ||
    `${me.interest_names[0] || "your idea"} and ${other.interest_names[0] || "their work"}`;
  const poetic = [...me.interest_names, ...other.interest_names].some((x) =>
    /poetry/i.test(x),
  );
  const illustrated = [...me.skill_names, ...other.skill_names].some((x) =>
    /illustration/i.test(x),
  );
  const title =
    poetic && illustrated
      ? "An illustrated spoken-word reel"
      : `${topic}: a ${me.preferred_format.toLowerCase()} together`;
  return {
    title,
    idea: `Create one small ${me.preferred_format.toLowerCase()} exploring ${topic}. Combine your perspectives and agree on credit before publishing.`,
    sender_role: `${me.display_name || "I"}: contribute ${me.skill_names.join(", ") || "the initial concept"}.`,
    recipient_role: `${other.display_name}: contribute ${other.skill_names.join(", ") || "a fresh perspective"}.`,
    next_step: `Exchange a rough outline in this workspace and agree on a realistic deadline (${me.availability.toLowerCase()}).`,
  };
}
export function validPostUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      u.hostname.includes(".")
    );
  } catch {
    return false;
  }
}
