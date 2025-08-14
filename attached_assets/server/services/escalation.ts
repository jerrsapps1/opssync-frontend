import { Pool } from "pg";
import { sendEmail, sendSMS } from "./notifications";
import { computeStatus } from "../utils/timeliness";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Auto-escalate items that are overdue for more than X hours.
 * Escalation sends to project manager and/or owner emails if present.
 */
export async function runEscalations() {
  const hours = Number(process.env.ESCALATE_AFTER_HOURS || 4);
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT i.id, i.title, i.due_at, i.submitted_at, p.name as project_name,
             p.manager_email, p.owner_email, p.supervisor_phone
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      WHERE i.submitted_at IS NULL
        AND i.deleted_at IS NULL
        AND i.due_at < (NOW() - make_interval(hours => $1))
    `, [hours]);

    let escalated = 0;
    for (const r of rows) {
      const status = computeStatus(r.due_at, r.submitted_at || null, 60);
      if (status !== "OVERDUE") continue;

      const subject = `[Escalation] ${r.title} in ${r.project_name} is OVERDUE`;
      const html = `<p>Project: <b>${r.project_name}</b></p>
                    <p>Item: <b>${r.title}</b></p>
                    <p>Status: <b>${status}</b></p>
                    <p>Due: ${new Date(r.due_at).toLocaleString()}</p>
                    <p>This was escalated after being overdue for ${hours} hour(s).</p>`;

      const recipients = [r.manager_email, r.owner_email].filter(Boolean) as string[];
      for (const to of recipients) {
        await sendEmail({ to, subject, html });
      }
      // Optional SMS nudge to supervisor
      if (r.supervisor_phone) {
        await sendSMS({
          to: r.supervisor_phone,
          message: `Escalation: '${r.title}' (${r.project_name}) is OVERDUE. Due ${new Date(r.due_at).toLocaleString()}.`,
        });
      }
      escalated++;
    }
    return { escalated, scanned: rows.length, hours };
  } finally {
    client.release();
  }
}
