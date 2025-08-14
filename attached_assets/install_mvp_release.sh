#!/usr/bin/env bash
set -euo pipefail

echo "=== MVP Release Installer ==="
echo "This will unzip all packages into the current project root and run patchers."
echo "Run inside your project root in Replit (or locally)."

PKG_DIR="./packages"

unzip_pkg () {
  local file="$1"
  if [ -f "$PKG_DIR/$file" ]; then
    echo "-> Unzipping $file"
    unzip -o "$PKG_DIR/$file" >/dev/null
  else
    echo "!! Missing $file (skipping)"
  fi
}

# 1) Core controls & per-tenant settings
unzip_pkg secured_controls_bundle.zip
# Mount owner/org routes
if [ -f scripts/insert_owner_org_routes.js ]; then
  node scripts/insert_owner_org_routes.js || true
fi

# 2) Manager widgets merged into Dashboard
unzip_pkg merge_manager_into_dashboard_bundle.zip
# Optional: hide standalone Manager page
if [ -f scripts/remove_manager_dashboard.js ]; then
  node scripts/remove_manager_dashboard.js || true
fi

# 3) API/UI feature gates
unzip_pkg tenant_feature_gate_bundle.zip

# 4) Per-tenant runners + plain language panel
unzip_pkg tenant_runners_and_plain_language_bundle.zip

# 5) Friendly CSV + "schedule health" alias
unzip_pkg friendly_language_export_bundle.zip

# 6) Tone alignment for emails + legend
unzip_pkg tone_alignment_bundle.zip

# 7) Optional add-ons (analytics, branding, billing pages, mobile tweaks)
unzip_pkg mvp_optional_addons_bundle.zip

# 8) Stripe webhooks + customer portal
unzip_pkg stripe_webhooks_portal_bundle.zip

# 9) Apple wallets prep + owner toggle
unzip_pkg apple_wallets_prep_bundle.zip

echo "=== Running SQL migrations (branding, billing, global/tenant features) ==="
if [ -n "${DATABASE_URL:-}" ]; then
  if [ -f server/sql/global_features.sql ]; then psql "$DATABASE_URL" -f server/sql/global_features.sql || true; fi
  if [ -f server/sql/tenant_controls.sql ]; then psql "$DATABASE_URL" -f server/sql/tenant_controls.sql || true; fi
  if [ -f server/sql/branding.sql ]; then psql "$DATABASE_URL" -f server/sql/branding.sql || true; fi
  if [ -f server/sql/billing.sql ]; then psql "$DATABASE_URL" -f server/sql/billing.sql || true; fi
else
  echo "!! DATABASE_URL not set — skipping SQL (run manually later)."
fi

echo "=== Stripe webhook endpoint note ==="
echo "Add in server/index.ts (raw body):"
echo "  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);"

echo "=== Routes to ensure in server/routes.ts (before return httpServer;) ==="
cat <<'ROUTES'
import analyticsRouter from "./routes/analytics";
import brandingRouter from "./routes/branding";
import billingRouter from "./routes/billing";
import managerFriendlyRouter from "./routes/manager_friendly";
import billingPortalRouter from "./routes/billing_portal";

app.use("/api/analytics", analyticsRouter);
app.use("/api/branding", brandingRouter);
app.use("/api/billing", billingRouter);
app.use("/api/manager", managerFriendlyRouter);
app.use("/api/billing", billingPortalRouter);
ROUTES

echo "=== Scheduler ==="
echo "Use the per-tenant scheduler:"
echo "  import { startCronPerTenant } from './services/cron_feature_checks_tenant';"
echo "  startCronPerTenant();"

echo "=== Owner toggle for wallets (messaging only) ==="
echo "  node scripts/enable_wallets_info_toggle.js  (optional)"

echo "=== Label patcher (optional) ==="
echo "  node scripts/patch_labels_field_friendly.js"

echo ""
echo "Done. Review output above. Commit changes and run your app."
