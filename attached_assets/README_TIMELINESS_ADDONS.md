# Timeliness Addons Bundle (Escalation + Weekly Digest + SLA)

This bundle adds:
1. **Escalation Rules** — auto-escalate overdue items after `ESCALATE_AFTER_HOURS`
2. **Weekly Digest** — Monday 09:00 email summary to supervisors/managers
3. **SLA Policies** — per-project thresholds and RAG scoring

## Files
- `server/services/escalation.ts`
- `server/services/digest.ts`
- `server/utils/sla.ts`
- `server/routes/sla.ts` (API: `/api/sla/...`)
- `server/routes/dev.ts` (optional triggers: `/api/dev/run-*`)
- `server/services/scheduler_addons.ts` (starts both jobs)
- `server/sql/timeliness_addons.sql`
- `scripts/insert_sla_route.js` (wire-up helper)
- `collections/timeliness_addons.postman_collection.json`

## Install & Wire
```bash
# 1) Copy files into your project, then run deps if needed
npm i node-cron node-fetch axios pg

# 2) Run SQL migration
psql "$DATABASE_URL" -f server/sql/timeliness_addons.sql

# 3) Mount routes (auto)
node scripts/insert_sla_route.js

# 4) Start cron addons (in your server boot file, e.g., server/index.ts)
import { startTimelinessAddons } from "./services/scheduler_addons";
startTimelinessAddons();
```

## Environment
```
# Escalation
ESCALATE_AFTER_HOURS=4

# Email (Brevo)
BREVO_API_KEY=...
FROM_EMAIL=no-reply@safetysync.ai
```

## Postman
Import `collections/timeliness_addons.postman_collection.json` and set `BASE_URL`.
