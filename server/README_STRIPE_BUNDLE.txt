Stripe Pricing + Billing Bundle
--------------------------------
Env required:
  STRIPE_SECRET_KEY=sk_live_... or sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRICE_STARTER=price_...
  STRIPE_PRICE_GROWTH=price_...
  STRIPE_PRICE_ENTERPRISE=price_...
  APP_URL=https://your.app (for success/cancel/portal return)
  (optional) INTERNAL_BASE_URL=http://localhost:3000 (upstream API base)

Wire in server/index.ts:
  import billing from "./routes/billing";
  import stripeWebhook from "./routes/stripe-webhook";
  import limits from "./routes/limits";

  app.use("/api", express.json());                 // JSON parser for normal routes
  app.use("/api", billing);
  app.use("/api", limits);
  app.use("/api", stripeWebhook);                  // NOTE: this route uses express.raw for signature

Stripe setup:
1) Create three Prices in your Stripe Dashboard (Starter/Growth/Enterprise monthly or yearly). Put the Price IDs in env vars.
2) Add a Webhook endpoint in Stripe to https://your.app/api/stripe/webhook selecting:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
3) Deploy. Hit /pricing to test.

Data:
- File-based store at data/customers.json. Swap to your DB later without changing client code.
- Demo orgId is "demo-org" via header x-org-id or query ?orgId=. Replace with your auth later.
