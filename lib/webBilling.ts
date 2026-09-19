import { supabase } from "./supabase";
export const webBillingEnabled = process.env.EXPO_PUBLIC_WEB_BILLING_ENABLED === "true";
export type WebBillingStatus = {
  active: boolean; managed: boolean; baseAmount: number; currency: string;
  nextAmount: number | null; discountPercent: number; renewsAt: number | null;
  cancelAtPeriodEnd: boolean; prices: number[];
};
export async function webBilling<T>(action: "status" | "checkout" | "portal"): Promise<T> {
  if (!webBillingEnabled || !supabase) throw new Error("Web subscriptions are not available yet.");
  const { data, error } = await supabase.functions.invoke("creator-billing", { body: { action } });
  if (error) {
    let message = "Could not connect to billing. Please try again.";
    try { const body = await error.context?.json(); if (body?.error) message = body.error; } catch {}
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}
export function formatPrice(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}
