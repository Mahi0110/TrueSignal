import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { blankProfile, type Profile } from "./matching";
type AppValue = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  draft: Profile;
  error: string;
  saveDraft: (p: Profile) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<AppValue | null>(null);
export function AppProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile>(blankProfile);
  const [error, setError] = useState("");
  const epoch = useRef(0);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem("truesignal:draft:v1")
      .then((raw) => {
        if (alive && raw) setDraft({ ...blankProfile, ...JSON.parse(raw) });
      })
      .catch(() => {});
    if (!supabase) {
      setLoading(false);
      return () => {
        alive = false;
      };
    }
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) setSession(next);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (alive) {
        setSession(data.session);
        if (error) setError(error.message);
        setLoading(false);
      }
    });
    const state = AppState.addEventListener("change", (s) => {
      if (s === "active") supabase?.auth.startAutoRefresh();
      else supabase?.auth.stopAutoRefresh();
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
      state.remove();
    };
  }, []);
  async function refresh() {
    if (!supabase || !session) return;
    const ticket = ++epoch.current;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (ticket !== epoch.current) return;
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    setProfile({ ...blankProfile, ...data });
  }
  useEffect(() => {
    ++epoch.current;
    setProfile(null);
    if (session) void refresh();
  }, [session?.user.id]);
  async function saveDraft(next: Profile) {
    await AsyncStorage.setItem("truesignal:draft:v1", JSON.stringify(next));
    setDraft(next);
  }
  async function signOut() {
    const { error } = await supabase!.auth.signOut();
    if (error) throw error;
    ++epoch.current;
    setSession(null);
    setProfile(null);
    setDraft(blankProfile);
    await AsyncStorage.removeItem("truesignal:draft:v1");
  }
  return (
    <Context.Provider
      value={{
        session,
        loading,
        profile,
        draft,
        error,
        saveDraft,
        refresh,
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const c = useContext(Context);
  if (!c) throw new Error("AppProvider missing");
  return c;
}
