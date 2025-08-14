# Secured Controls Bundle (Owner + Org)

This bundle gives you:
- **Owner (platform) controls** — global features stored in `global_features`
- **Org (tenant) controls** — per-tenant overrides + notification prefs
- **Hardened routing** — owner-only endpoints, org-admin-only endpoints
- **Client pages** — `/owner/settings` and `/org/settings`

## Install
```bash
# 1) Unzip in project root
unzip secured_controls_bundle.zip

# 2) Run SQL
psql "$DATABASE_URL" -f server/sql/global_features.sql
psql "$DATABASE_URL" -f server/sql/tenant_controls.sql

# 3) Mount routes automatically
node scripts/insert_owner_org_routes.js

# 4) Add frontend routes
# import OwnerSettings from "./pages/OwnerSettings";
# import OrgSettings from "./pages/OrgSettings";
# <Route path="/owner/settings" element={<OwnerSettings />} />
# <Route path="/org/settings" element={<OrgSettings />} />
```

## Security Notes
- Owner endpoints require:
  - Authenticated user AND email == `OWNER_EMAIL` (server-side check)
- Org endpoints require:
  - Authenticated user AND role in (`OWNER`,`ADMIN`) AND valid `tenantId`
- Global flags are merged as: **env defaults → global_features → tenant overrides**

## Env
```
OWNER_EMAIL=you@yourdomain.com
FEATURE_SUPERVISOR=1
FEATURE_MANAGER=0
FEATURE_SLA=0
FEATURE_REMINDERS=1
FEATURE_ESCALATIONS=0
FEATURE_WEEKLY_DIGEST=0
```
