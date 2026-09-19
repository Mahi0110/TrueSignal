/** All monetary values are integer minor units. Initial payment earns the first renewal discount. */
export const POLICY = "loyalty-v1";
export const STEPS = [0, 5, 10, 15, 20] as const;
export function discountForPayments(count: number): number {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid payment count");
  return STEPS[Math.min(count, 4)];
}
export function discountedAmount(base: number, percent: number): number {
  return base - Math.round(base * percent / 100);
}
export function objectId(value: any): string | undefined {
  return typeof value === "string" ? value : value?.id;
}
export function subscriptionId(invoice: any): string | undefined {
  return objectId(invoice.parent?.subscription_details?.subscription ?? invoice.subscription);
}
export function qualifyingPeriod(invoice: any, subscription: string, price: string) {
  if (invoice.status !== "paid" || invoice.amount_paid <= 0 ||
      !["subscription_create", "subscription_cycle"].includes(invoice.billing_reason) ||
      subscriptionId(invoice) !== subscription || invoice.lines?.has_more) return null;
  const lines = invoice.lines?.data ?? [];
  if (lines.length !== 1) return null;
  const line = lines[0];
  if (line.proration || line.parent?.subscription_item_details?.proration ||
      objectId(line.pricing?.price_details?.price ?? line.price) !== price ||
      line.quantity !== 1 || !(line.period?.end > line.period?.start)) return null;
  return { start: line.period.start, end: line.period.end };
}
export function isOpenSubscription(sub: any): boolean {
  return !["canceled", "incomplete_expired"].includes(sub.status);
}
export function ownsLoyaltySubscription(sub: any, userId: string, customerId: string, priceId: string): boolean {
  return sub.metadata?.app_user_id === userId && sub.metadata?.loyalty_policy === POLICY &&
    objectId(sub.customer) === customerId && sub.items?.data?.length === 1 &&
    objectId(sub.items.data[0].price) === priceId && sub.items.data[0].quantity === 1;
}
/** Stripe signs the RAW body. Accept rotated v1 signatures, with a five-minute replay window. */
export async function verifySignature(body: string, header: string, secret: string, now = Date.now() / 1000) {
  const fields = header.split(",").map((part) => part.trim().split("="));
  const timestamps = fields.filter(([k]) => k === "t");
  if (timestamps.length !== 1) return false;
  const timestamp = timestamps[0][1];
  if (!/^\d+$/.test(timestamp) || Math.abs(now - Number(timestamp)) > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  const expected = Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, "0")).join("");
  return fields.filter(([k]) => k === "v1").some(([, actual]) => {
    if (!/^[0-9a-f]{64}$/.test(actual ?? "")) return false;
    let mismatch = 0;
    for (let i = 0; i < 64; i++) mismatch |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
    return mismatch === 0;
  });
}
