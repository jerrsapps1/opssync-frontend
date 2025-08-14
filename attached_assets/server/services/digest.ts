import { Pool } from "pg";
import { sendEmail } from "./notifications";
import { computeStatus } from "../utils/timeliness";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Weekly digest for managers and supervisors.
 * Groups items by project and status for the past week and upcoming week.
 */
export async function runWeeklyDigest() {
  const client = await pool.connect();
  try {
    // Gather recipients from projects table
    const recRes = await client.query(`
      SELECT DISTINCT manager_email AS email FROM projects WHERE manager_email IS NOT NULL
      UNION
      SELECT DISTINCT supervisor_email AS email FROM projects WHERE supervisor_email IS NOT NULL
    `);
    const recipients = recRes.rows.map((r: any) => r.email).filter(Boolean);

    // Pull items due in last 7 days or next 7 days
    const itemsRes = await client.query(`
      SELECT i.id, i.title, i.due_at, i.submitted_at, p.name AS project_name
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      WHERE i.deleted_at IS NULL
        AND i.due_at BETWEEN (NOW() - interval '7 days') AND (NOW() + interval '7 days')
      ORDER BY p.name ASC, i.due_at ASC
    `);

    const warnMinutes = Number(process.env.REMINDER_MINUTES_BEFORE || 60);
    const lines: string[] = [];
    let currentProject: string | null = null;

    for (const r of itemsRes.rows) {
      const status = computeStatus(r.due_at, r.submitted_at || null, warnMinutes);
      if (currentProject !== r.project_name) {
        currentProject = r.project_name;
        lines.push(`<h3 style="margin:16px 0 6px">${currentProject}</h3>`);
      }
      lines.push(`<div>- ${r.title} • ${status} • due ${new Date(r.due_at).toLocaleString()} ${r.submitted_at ? `(submitted ${new Date(r.submitted_at).toLocaleString()})` : ""}</div>`);
    }

    const html = `
      <div>
        <h2>Weekly Timeliness Digest</h2>
        <p>Summary of items due last week and the upcoming week.</p>
        ${lines.join("") || "<p>No items found for the period.</p>"}
      </div>
    `;

    let sent = 0;
    for (const to of recipients) {
      await sendEmail({ to, subject: "Weekly Timeliness Digest", html });
      sent++;
    }
    return { recipients: recipients.length, sent };
  } finally {
    client.release();
  }
}
