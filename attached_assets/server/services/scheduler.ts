import cron from "node-cron";
import fetch from "node-fetch";

export function startTimelinessScheduler(baseUrl = "") {
  const url = `${baseUrl || ""}/api/supervisor/run-reminders`;
  // Every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const txt = await res.text();
        console.error("[scheduler] run-reminders failed:", res.status, txt);
      } else {
        const json = await res.json();
        console.log("[scheduler] reminders ok:", json);
      }
    } catch (e: any) {
      console.error("[scheduler] error:", e.message);
    }
  });
  console.log("[scheduler] Timeliness scheduler started (every 15 min)");
}
