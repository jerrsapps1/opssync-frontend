import cron from "node-cron";
import fetch from "node-fetch";
import { runEscalations } from "./escalation";
import { runWeeklyDigest } from "./digest";

/**
 * Start extended schedules:
 * - Every 30 minutes: escalation scan
 * - Every Monday at 09:00: weekly digest
 * - Keep existing 15-min reminder task if you still use services/scheduler.ts
 */
export function startTimelinessAddons() {
  // Escalations every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      const res = await runEscalations();
      console.log("[scheduler:addons] escalations:", res);
    } catch (e: any) {
      console.error("[scheduler:addons] escalation error:", e.message);
    }
  });

  // Weekly digest Monday 09:00
  cron.schedule("0 9 * * 1", async () => {
    try {
      const res = await runWeeklyDigest();
      console.log("[scheduler:addons] weekly digest:", res);
    } catch (e: any) {
      console.error("[scheduler:addons] digest error:", e.message);
    }
  });

  console.log("[scheduler:addons] Escalations (30m) + Weekly Digest (Mon 09:00) started");
}
