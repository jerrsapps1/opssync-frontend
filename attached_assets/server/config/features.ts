// server/config/features.ts
// Centralized feature flags. Toggle via environment variables.
// Examples (in .env / Replit Secrets / Render):
//   FEATURE_SUPERVISOR=1
//   FEATURE_MANAGER=0
//   FEATURE_SLA=1
//   FEATURE_REMINDERS=1
//   FEATURE_ESCALATIONS=0
//   FEATURE_WEEKLY_DIGEST=0

export const features = {
  SUPERVISOR: process.env.FEATURE_SUPERVISOR === "1",
  MANAGER: process.env.FEATURE_MANAGER === "1",
  SLA: process.env.FEATURE_SLA === "1",
  REMINDERS: process.env.FEATURE_REMINDERS === "1",
  ESCALATIONS: process.env.FEATURE_ESCALATIONS === "1",
  WEEKLY_DIGEST: process.env.FEATURE_WEEKLY_DIGEST === "1",
};
