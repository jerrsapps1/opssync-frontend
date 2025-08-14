# Customer Controls MVP (Per-Client Feature & Notification Controls)

Give each customer (tenant) independent control without a heavy admin build.

## What’s Included
- **DB**: `tenants`, `org_users`, `feature_overrides`, `notification_prefs`
- **Server**:
  - `middleware/authz.ts` — `requireRole`, `requireTenant`, `getTenantId`
  - `utils/tenant_features.ts` — resolves global flags + tenant override
  - `routes/org_admin.ts` — `/api/org-admin/features` & `/api/org-admin/notifications` (OWNER/ADMIN only)
- **Client**:
  - `pages/OrgSettings.tsx` — simple toggles page (owner/admin only)
  - `components/Switch.tsx`
- **Wire-up**:
  - `scripts/insert_org_admin_routes.js` — mounts `/api/org-admin` in `server/routes.ts`

## Install
```bash
# 1) Unzip into project root
unzip customer_controls_mvp_bundle.zip

# 2) Run SQL
psql "$DATABASE_URL" -f server/sql/tenant_controls.sql

# 3) Mount routes
node scripts/insert_org_admin_routes.js

# 4) Add frontend route (example)
# import OrgSettings from "./pages/OrgSettings";
# <Route path="/org/settings" element={<OrgSettings />} />
```

## Notes
- Requires your auth middleware to attach `{ userId, role, tenantId }` to `req.user`.
- Tenant feature resolution falls back to global `FEATURE_*` env flags when no override exists.
- Use roles: OWNER/ADMIN to access org-level settings; restrict page with your existing auth guard.
