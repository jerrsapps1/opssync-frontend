// Global feature flags (defaults).
// You can control via env and owner overrides.
export const features = {
  SUPERVISOR: process.env.FEATURE_SUPERVISOR === "1",
  MANAGER: process.env.FEATURE_MANAGER === "1",
  SLA: process.env.FEATURE_SLA === "1",
  REMINDERS: process.env.FEATURE_REMINDERS === "1",
  ESCALATIONS: process.env.FEATURE_ESCALATIONS === "1",
  WEEKLY_DIGEST: process.env.FEATURE_WEEKLY_DIGEST === "1",
};
