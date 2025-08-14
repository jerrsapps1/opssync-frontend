import * as cron from "node-cron";
import { runEscalations } from "./escalation";
import { runWeeklyDigest } from "./digest";

let escalationJob: cron.ScheduledTask | null = null;
let digestJob: cron.ScheduledTask | null = null;

export function startTimelinessAddons() {
  console.log("🔄 Starting timeliness addon schedulers...");
  
  // Escalation job: every 30 minutes
  escalationJob = cron.schedule("*/30 * * * *", async () => {
    try {
      console.log("⚡ Running escalation check...");
      const result = await runEscalations();
      console.log(`✅ Escalation complete: ${result.escalated} escalated, ${result.scanned} scanned`);
    } catch (error) {
      console.error("❌ Escalation job error:", error);
    }
  });
  
  // Weekly digest: Monday at 09:00
  digestJob = cron.schedule("0 9 * * 1", async () => {
    try {
      console.log("📧 Running weekly digest...");
      const result = await runWeeklyDigest();
      console.log(`✅ Weekly digest complete: ${result.sent} emails sent to ${result.projects} projects`);
    } catch (error) {
      console.error("❌ Weekly digest job error:", error);
    }
  });
  
  console.log("✅ Timeliness addon schedulers started successfully");
}

export function stopTimelinessAddons() {
  if (escalationJob) {
    escalationJob.destroy();
    escalationJob = null;
  }
  
  if (digestJob) {
    digestJob.destroy();
    digestJob = null;
  }
  
  console.log("🛑 Timeliness addon schedulers stopped");
}