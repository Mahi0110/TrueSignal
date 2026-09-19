import { createBilling } from "../_shared/billing.ts";
Deno.serve(createBilling((key) => Deno.env.get(key)).app);
