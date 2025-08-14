# Slim Mode (Feature Flags)

Keep the repo big, run the app small. Flip features on/off with ENV flags.

## Files
- `server/config/features.ts` (Node): reads `FEATURE_*` env vars
- `client/src/lib/features.ts` (Vite): reads `VITE_FEATURE_*` env vars

## Server Usage
In `server/index.ts` (or where you start schedulers/routes):

```ts
import { features } from "./config/features";

// Mount routes conditionally in server/routes.ts (or similar):
// import supervisorRouter from "./routes/supervisor";
// if (features.SUPERVISOR) app.use("/api/supervisor", supervisorRouter);

// import managerRouter from "./routes/manager";
// if (features.MANAGER) app.use("/api/manager", managerRouter);

// SLA APIs
// import slaRouter from "./routes/sla";
// if (features.SLA) app.use("/api/sla", slaRouter);

// Schedulers
// import { startTimelinessAddons } from "./services/scheduler_addons";
// if (features.ESCALATIONS || features.WEEKLY_DIGEST) startTimelinessAddons();
```

> If the mounts already exist, wrap them in `if (features.X)` blocks.

## Client Usage
In your nav or routes, gate UI:

```tsx
import { FEATURES } from "../lib/features";

{FEATURES.SUPERVISOR && <Link to="/supervisor">Supervisor</Link>}
{FEATURES.MANAGER && <Link to="/manager">Manager</Link>}
```

## ENV Examples
Add to `.env` (and your hosting env):

```
# Server
FEATURE_SUPERVISOR=1
FEATURE_MANAGER=0
FEATURE_SLA=1
FEATURE_REMINDERS=1
FEATURE_ESCALATIONS=0
FEATURE_WEEKLY_DIGEST=0

# Client (Vite)
VITE_FEATURE_SUPERVISOR=1
VITE_FEATURE_MANAGER=0
VITE_FEATURE_SLA=1
VITE_FEATURE_REMINDERS=1
VITE_FEATURE_ESCALATIONS=0
VITE_FEATURE_WEEKLY_DIGEST=0
```

## Suggested Slim Phases
**Phase 1 (smallest viable):**
- SUPERVISOR=1, SLA=0, REMINDERS=0, MANAGER=0, ESCALATIONS=0, WEEKLY_DIGEST=0

**Phase 2 (nudges only):**
- SUPERVISOR=1, REMINDERS=1

**Phase 3 (targets):**
- SUPERVISOR=1, SLA=1

**Phase 4 (management):**
- MANAGER=1

**Phase 5 (automation):**
- ESCALATIONS=1, WEEKLY_DIGEST=1
```
