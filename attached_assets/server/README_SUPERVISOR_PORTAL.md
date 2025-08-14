# Supervisor Portal + Timeliness Bundle

This bundle adds a Supervisor Portal UI with:
- Timeliness dashboard (On Time, At Risk, Overdue)
- Pre-start checklist gate (blocks project start until completed)
- Change request creation
- Acknowledge/mark-done for required updates

It also adds optional Email (Brevo) + SMS (Twilio) reminders and a cron scheduler.

## 1) Drop-in Instructions (Frontend)

Copy these into your existing Vite React app:

```
client/src/pages/SupervisorPortal.tsx
client/src/components/TimelinessDashboard.tsx
client/src/components/ChecklistForm.tsx
client/src/components/ChangeRequestForm.tsx
client/src/components/StatusPill.tsx
client/src/lib/api.ts
```

Add a route to render the page (example with React Router v6):

```tsx
import SupervisorPortal from "./pages/SupervisorPortal";
<Route path="/supervisor" element={<SupervisorPortal />} />
```

## 2) Backend (Express + PostgreSQL)

Copy these:

```
server/routes/supervisor.ts
server/utils/timeliness.ts
server/services/notifications.ts
server/services/scheduler.ts
server/sql/supervisor_timeliness.sql
```

Install deps:
```
npm i node-cron node-fetch axios pg
```

If using TypeScript, also:
```
npm i -D @types/node-fetch @types/node-cron
```

Wire the router in your server (e.g., in `server/index.ts`):

```ts
import supervisorRouter from "./routes/supervisor";
app.use("/api/supervisor", supervisorRouter);
```

Start the scheduler after server starts (optional):
```ts
import { startTimelinessScheduler } from "./services/scheduler";
startTimelinessScheduler(process.env.BASE_URL || "");
```

Run the SQL (one time) to create tables:
```
psql "$DATABASE_URL" -f server/sql/supervisor_timeliness.sql
```

Or run its contents in your DB admin tool.

## 3) Environment Variables

```
# Email (Brevo)
BREVO_API_KEY=...
FROM_EMAIL=no-reply@safetysync.ai

# SMS (Twilio) - optional
TWILIO_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+15555555555

# Timeliness warnings
REMINDER_MINUTES_BEFORE=60
```

## 4) Test Flow

1. Create a project:
```sql
insert into projects (name, supervisor_email, supervisor_phone) 
values ('Demo Project A','owner@safetysync.ai','+15555555555');
```

2. Require an update due soon:
```bash
curl -X POST http://localhost:3000/api/supervisor/projects/<PROJECT_ID>/require-update \
  -H "Content-Type: application/json" \
  -d '{"title":"Daily field update","dueAt":"2025-08-13T23:59:00Z"}'
```

3. Open `/supervisor` and mark it Done.

4. Trigger reminders manually:
```bash
curl -X POST http://localhost:3000/api/supervisor/run-reminders
```

## Notes

- If env keys are not set, notifications simply log warnings and skip sending (so it won't crash).
- The scheduler uses an HTTP call back into your app; set `BASE_URL` in prod (e.g., `https://safetysync.ai`).
- The pre-start checklist flips `projects.start_blocked` to `FALSE` when submitted.
- Adjust styles to your Tailwind theme as needed.
