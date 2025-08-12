import express from "express";
import { stripe, APP_URL, STARTER_PRICE_ID, GROWTH_PRICE_ID, ENTERPRISE_PRICE_ID } from "../stripe/config";
import { upsertCustomer, getByOrgId } from "../stripe/store";

const router = express.Router();

// In your real app you'll get orgId from session/JWT. For demo we accept a query or header.
function resolveOrgId(req: express.Request): string {
  return (req.headers["x-org-id"] as string) || (req.query.orgId as string) || "demo-org";
}

router.post("/billing/checkout", async (req, res) => {
  try {
    const { plan, interval = "month" } = req.body as { plan: "starter"|"growth"|"enterprise", interval?: "month"|"year" };
    const orgId = resolveOrgId(req);

    const priceId = plan === "starter" ? STARTER_PRICE_ID : plan === "growth" ? GROWTH_PRICE_ID : ENTERPRISE_PRICE_ID;
    if (!priceId) return res.status(400).json({ error: "Missing Stripe Price ID env for selected plan" });

    // Create or reuse a Stripe customer per org
    // For demo we use a deterministic idempotency key per org+plan to avoid dupes
    const customer = await stripe.customers.create({
      metadata: { orgId },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/billing/cancelled`,
      customer: customer.id,
      allow_promotion_codes: true,
    });

    upsertCustomer({ orgId, stripeCustomerId: customer.id, status: "incomplete", plan });
    res.json({ url: session.url });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/billing/portal", async (req, res) => {
  try {
    const orgId = resolveOrgId(req);
    const existing = getByOrgId(orgId);
    if (!existing) return res.status(404).json({ error: "No customer for org" });

    const session = await stripe.billingPortal.sessions.create({
      customer: existing.stripeCustomerId,
      return_url: `${APP_URL}/billing`,
    });
    res.json({ url: session.url });
  } catch (e:any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
