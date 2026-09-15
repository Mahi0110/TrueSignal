import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import type { CustomerInfo } from "react-native-purchases";
import { useApp } from "./AppContext";
import { errorMessage } from "./api";
let identity: string | null = null;
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(action: () => Promise<T>): Promise<T> {
  const work = queue.then(action);
  queue = work.catch(() => {});
  return work;
}
const Context = createContext({
  active: false,
  busy: false,
  message: "",
  open: async (_restore = false) => {},
  manage: async () => {},
});
export function PurchaseProvider({ children }: PropsWithChildren) {
  const { session } = useApp();
  const uid = session?.user.id;
  const currentUser = useRef(uid);
  currentUser.current = uid;
  const [entitlement, setEntitlement] = useState<{
    uid: string;
    active: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const key =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
        process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
        process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  const supported = Platform.OS !== "web" && Constants.appOwnership !== "expo";
  const entitlementId =
    process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || "creator_pass";
  const receive = (info: CustomerInfo, owner: string) => {
    if (currentUser.current === owner)
      setEntitlement({
        uid: owner,
        active: !!info.entitlements.active[entitlementId],
      });
  };
  async function client(owner: string) {
    if (!supported)
      throw new Error(
        "Purchases are available in the installed iOS or Android app. You can explore and collaborate here for free.",
      );
    if (!key)
      throw new Error(
        "Creator Pass is not available yet. Free collaboration remains available.",
      );
    const P = (await import("react-native-purchases")).default;
    if (!(await P.isConfigured())) {
      P.configure({ apiKey: key, appUserID: owner });
      identity = owner;
    } else if (identity !== owner) {
      await P.logIn(owner);
      identity = owner;
    }
    return P;
  }
  useEffect(() => {
    let alive = true;
    let dispose = () => {};
    setEntitlement(null);
    setMessage("");
    if (uid && supported && key) {
      const owner = uid;
      void serial(async () => {
        const P = await client(owner);
        if (!alive) return;
        receive(await P.getCustomerInfo(), owner);
        const listener = (info: CustomerInfo) => {
          if (alive) receive(info, owner);
        };
        P.addCustomerInfoUpdateListener(listener);
        const state = AppState.addEventListener("change", (status) => {
          if (status === "active")
            void serial(async () => {
              if (alive)
                receive(await (await client(owner)).getCustomerInfo(), owner);
            }).catch(() => {
              if (alive) setEntitlement(null);
            });
        });
        dispose = () => {
          P.removeCustomerInfoUpdateListener(listener);
          state.remove();
        };
        if (!alive) dispose();
      }).catch((e) => {
        if (alive) setMessage(errorMessage(e));
      });
    } else if (!uid && identity && supported) {
      void serial(async () => {
        const P = (await import("react-native-purchases")).default;
        if (await P.isConfigured()) await P.logOut();
        identity = null;
      }).catch(() => {
        identity = null;
      });
    }
    return () => {
      alive = false;
      dispose();
    };
  }, [uid, supported, key]);
  async function open(restore = false) {
    if (busy) return;
    if (!uid) {
      setMessage("Sign in to view plans or restore your purchases.");
      return;
    }
    const owner = uid;
    setBusy(true);
    try {
      await serial(async () => {
        if (currentUser.current !== owner) return;
        const P = await client(owner);
        if (restore) {
          const info = await P.restorePurchases();
          receive(info, owner);
          setMessage(
            info.entitlements.active[entitlementId]
              ? "Your Creator Pass is active."
              : "No active Creator Pass was found.",
          );
          return;
        }
        const UI = (await import("react-native-purchases-ui")).default;
        const result = await UI.presentPaywall({ displayCloseButton: true });
        const info = await P.getCustomerInfo();
        receive(info, owner);
        setMessage(
          result === "CANCELLED"
            ? "Purchase cancelled. Free collaboration remains available."
            : result === "ERROR"
              ? "The purchase could not be completed. Please try again."
              : info.entitlements.active[entitlementId]
                ? "Your Creator Pass is active."
                : "No active subscription was found.",
        );
      });
    } catch (e) {
      if (currentUser.current === owner) setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function manage() {
    if (!uid || busy) return;
    setBusy(true);
    try {
      await serial(async () => {
        await client(uid);
        await (
          await import("react-native-purchases-ui")
        ).default.presentCustomerCenter();
      });
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        active: entitlement?.uid === uid && !!entitlement?.active,
        busy,
        message,
        open,
        manage,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const usePurchases = () => useContext(Context);
