Client Billing Pages
--------------------
Add routes:
  import PricingPage from "@/pages/billing/pricing";
  import BillingHome from "@/pages/billing";

  <Route path="/pricing" element={<PricingPage />} />
  <Route path="/billing" element={<BillingHome />} />

Notes:
- Pricing page posts to /api/billing/checkout with the selected plan and interval.
- Billing page opens Stripe Customer Portal via /api/billing/portal.
- In production, replace the demo orgId input with your actual org from session/JWT.
