import { createHmac, timingSafeEqual } from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";

/**
 * Stripe webhook — payment-link billing.
 * Each plan has its own Stripe Payment Link; the upgrade buttons append
 * ?client_reference_id=<business_id>. On checkout.session.completed we match
 * the payment link to a plan and flip the business over.
 *
 * Stripe setup: create 3 payment links, set the env vars, and point a webhook
 * (event: checkout.session.completed) at /api/stripe/webhook.
 */

const PLAN_BY_LINK: Record<string, string> = {};
for (const [env, plan] of [
  ["STRIPE_PLINK_SOLO", "solo"],
  ["STRIPE_PLINK_STANDARD", "standard"],
  ["STRIPE_PLINK_PRO", "pro"],
] as const) {
  const url = process.env[env];
  // Payment link id is the last path segment of the URL (also matches raw ids).
  const id = url?.trim().split("/").filter(Boolean).pop();
  if (id) PLAN_BY_LINK[id] = plan;
}

function verifySignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string])
  );
  if (!parts.t || !parts.v1) return false;
  const expected = createHmac("sha256", secret)
    .update(`${parts.t}.${payload}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "not configured" }, { status: 503 });

  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";
  if (!verifySignature(payload, sig, secret)) {
    return Response.json({ error: "bad signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type: string;
    data: {
      object: {
        client_reference_id?: string | null;
        payment_link?: string | null;
        customer?: string | null;
        subscription?: string | null;
      };
    };
  };

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const plan = s.payment_link ? PLAN_BY_LINK[s.payment_link] : undefined;
    const admin = getAdminSupabase();
    if (plan && s.client_reference_id && admin) {
      await admin
        .from("lf_businesses")
        .update({
          plan,
          stripe_customer_id: s.customer ?? null,
          stripe_subscription_id: s.subscription ?? null,
        })
        .eq("id", s.client_reference_id);
    }
  }

  return Response.json({ received: true });
}
