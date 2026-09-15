import { supabase } from "./supabase";
import type { Profile, Brief, Collaboration, AudiencePlan } from "./matching";
export function db() {
  if (!supabase)
    throw new Error(
      "Account services are not connected yet. Please try again later.",
    );
  return supabase;
}
export async function rpc<T = unknown>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
export async function saveProfile(p: Profile) {
  return rpc("save_creator_profile", { payload: p });
}
export async function profiles() {
  const { data, error } = await db()
    .from("profiles")
    .select("*")
    .eq("is_onboarded", true)
    .eq("discoverable", true)
    .order("id");
  if (error) throw new Error(error.message);
  return data as Profile[];
}
export async function collaborations() {
  const { data, error } = await db()
    .from("collaborations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Collaboration[];
}
export async function createCollaboration(recipient: string, brief: Brief) {
  return rpc<string>("create_collaboration", { recipient, brief });
}
export async function changeCollaboration(id: string, action: string) {
  return rpc("change_collaboration", { target: id, action });
}
export async function plans(id: string) {
  const { data, error } = await db()
    .from("audience_plans")
    .select("*")
    .eq("collaboration_id", id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as AudiencePlan[];
}
export function errorMessage(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Something went wrong. Please try again.";
}
