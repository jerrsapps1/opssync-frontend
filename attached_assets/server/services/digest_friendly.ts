import { Pool } from "pg";
import { sendEmail } from "./notifications";
import { computeStatus } from "../utils/timeliness";
import { wrapEmail, statusPill } from "../utils/email_templates";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function toPlain(raw: string) {
  if (raw === "OVERDUE" || raw === "RED") return "Late";
  if (raw === "AT_RISK" || raw === "AMBER") return "Due soon";
  return "On time";
}

export async function runWeeklyDigestForTenantFriendly(tenantId: string) {
  const client = await pool.connect();
  try {
    const recRes = await client.query(`
      SELECT DISTINCT manager_email AS email FROM projects WHERE tenant_id=$1 AND manager_email IS NOT NULL
      UNION
      SELECT DISTINCT supervisor_email AS email FROM projects WHERE tenant_id=$1 AND supervisor_email IS NOT NULL
    `, [tenantId]);
    const recipients = recRes.rows.map((r: any) => r.email).filter(Boolean);

    const itemsRes = await client.query(`
      SELECT i.id, i.title, i.due_at, i.submitted_at, p.name AS project_name
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      WHERE p.tenant_id = $1
        AND i.deleted_at IS NULL
        AND i.due_at BETWEEN (NOW() - interval '7 days') AND (NOW() + interval '7 days')
      ORDER BY p.name ASC, i.due_at ASC
    `, [tenantId]);

    const warnMinutes = Number(process.env.REMINDER_MINUTES_BEFORE || 60);
    const lines: string[] = [];
    let currentProject: string | null = null;

    for (const r of itemsRes.rows) {
      const friendly = toPlain(computeStatus(r.due_at, r.submitted_at || null, warnMinutes));
      if (currentProject !== r.project_name) {
        currentProject = r.project_name;
        lines.push(`<h3 style="margin:16px 0 6px">${currentProject}</h3>`);
      }
      lines.push(`<div style="margin:2px 0">• ${r.title} — ${statusPill(friendly)} — due ${new Date(r.due_at).toLocaleString()} ${r.submitted_at ? `(done ${new Date(r.submitted_at).toLocaleString()})` : ""}</div>`);
    }

    const body = `
      <p>Here’s what’s coming up and what happened last week.</p>
      ${lines.join("") || "<p>No tasks for this period.</p>"}
    `;
    const html = wrapEmail(body, "Weekly Update");

    let sent = 0;
    for (const to of recipients) { await sendEmail({ to, subject: "Weekly Update", html }); sent++; }
    return { tenantId, recipients: recipients.length, sent };
  } finally {
    client.release();
  }
}
