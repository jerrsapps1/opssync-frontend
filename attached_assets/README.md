# MVP Release Bundle

This single bundle contains all packages needed to ship your MVP.
Included packages:
- secured_controls_bundle.zip
- merge_manager_into_dashboard_bundle.zip
- tenant_feature_gate_bundle.zip
- cron_feature_checks_bundle.zip
- tenant_runners_and_plain_language_bundle.zip
- friendly_language_export_bundle.zip
- tone_alignment_bundle.zip
- mvp_optional_addons_bundle.zip
- stripe_webhooks_portal_bundle.zip
- apple_wallets_prep_bundle.zip

## Quick start (inside your project root)
```bash
unzip mvp_release_bundle.zip
bash install_mvp_release.sh
```
The installer unpacks packages, wires routes, runs patchers, and attempts SQL migrations (if `DATABASE_URL` is set).

## After install: things to verify
1. **server/routes.ts** has:
   - /api/owner-admin, /api/org-admin (auto-wired)
   - /api/analytics, /api/branding, /api/billing, /api/manager (friendly)
2. **server/index.ts** adds the Stripe webhook with **express.raw()**:
   ```ts
   import stripeWebhookRouter from "./routes/stripe_webhooks";
   app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
   ```
3. **Scheduler:** using `startCronPerTenant()`.
4. **Client routes:** you added pages from Optional Add‑Ons as desired.
5. **Env:**
   ```
   OWNER_EMAIL=you@yourdomain.com
   DATABASE_URL=postgres://...
   # Feature defaults
   FEATURE_SUPERVISOR=1
   FEATURE_MANAGER=1
   FEATURE_SLA=1
   FEATURE_REMINDERS=1
   FEATURE_ESCALATIONS=1
   FEATURE_WEEKLY_DIGEST=1
   # Wallets messaging toggle (optional)
   FEATURE_WALLETS_INFO=0
   # Stripe (if cards on)
   STRIPE_SECRET_KEY=sk_live_or_test_xxx
   STRIPE_PRICE_ID=price_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   PUBLIC_URL=https://app.yourdomain.com
   ```

## Deploy targets
- **GitHub**: commit the resulting files.
- **Render/Heroku/Fly**: set env vars, add webhook URL in Stripe.
- **Netlify/Cloudflare Pages**: deploy client; ensure `.well-known/` is in the published folder for Apple Pay (when ready).

You’re good to launch and iterate with customer-specific toggles and tenant-safe jobs.
