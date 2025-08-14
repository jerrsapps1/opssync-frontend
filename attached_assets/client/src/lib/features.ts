// client/src/lib/features.ts
// Frontend flags using Vite env vars with safe defaults.
// Define in .env or your hosting env:
//   VITE_FEATURE_SUPERVISOR=1
//   VITE_FEATURE_MANAGER=0
//   VITE_FEATURE_SLA=1

const f = (k: string, def = "0") =>
  (import.meta as any).env?.[k] ?? (window as any).__FEATURES__?.[k] ?? def;

export const FEATURES = {
  SUPERVISOR: f("VITE_FEATURE_SUPERVISOR", "1") === "1",
  MANAGER: f("VITE_FEATURE_MANAGER", "0") === "1",
  SLA: f("VITE_FEATURE_SLA", "1") === "1",
  REMINDERS: f("VITE_FEATURE_REMINDERS", "1") === "1",
  ESCALATIONS: f("VITE_FEATURE_ESCALATIONS", "0") === "1",
  WEEKLY_DIGEST: f("VITE_FEATURE_WEEKLY_DIGEST", "0") === "1",
};
