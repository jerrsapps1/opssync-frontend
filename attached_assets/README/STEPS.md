# Cron Feature Checks (Per-tenant protection for background jobs)

This bundle keeps background jobs (escalations, weekly digest, reminders) from running
for tenants who don't have the feature enabled — without adding more middleware.

## 1) Unzip
```bash
unzip cron_feature_checks_bundle.zip
```

## 2) Use the checked scheduler
Option A — auto-swap (tries to patch `server/index.ts`):
```bash
node scripts/swap_in_cron_checks.js
```

Option B — manual (explicit is fine):
```ts
// server/index.ts
import { startCronWithTenantChecks } from "./services/cron_feature_checks";
startCronWithTenantChecks();
```

## 3) (Optional but recommended) Update your services to be tenant-aware
If your SQL has multi-tenant columns (e.g., `projects.tenant_id`), update the runners to filter by tenant:
```sql
-- In escalation/digest SQL WHERE clause, add:
WHERE p.tenant_id = $1
```
Then expose `runEscalationsForTenant(tenantId)` / `runWeeklyDigestForTenant(tenantId)`
and call those in the wrappers. If not available yet, the wrapper still prevents
sending anything when the tenant has the feature off.

## 4) That’s it
You now have:
- UI hidden by feature flags
- APIs gated per-tenant
- Background jobs skipping tenants where features/prefs are off
