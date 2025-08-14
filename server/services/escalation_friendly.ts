import pg from "pg";

const { Pool } = pg;
import { sendEmail, sendSMS } from "./notifications";
import { computeStatus } from "../utils/timeliness";
import { wrapEmail, statusPill } from "../utils/email_templates";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function toPlain(status: string) {
  if (status === "OVERDUE" || status === "RED") return "Late";
  if (status === "AT_RISK" || status === "AMBER") return "Due soon";
  return "On time";
}

export async function runEscalationsForTenantFriendly(tenantId: string) {
  const hours = Number(process.env.ESCALATE_AFTER_HOURS || 4);
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT i.id, i.title, i.due_at, i.submitted_at,
             p.name AS project_name, p.manager_email, p.owner_email, p.supervisor_phone
      FROM timeliness_items i
      JOIN projects p ON p.id = i.project_id
      WHERE p.tenant_id = $1
        AND i.submitted_at IS NULL
        AND i.deleted_at IS NULL
        AND i.due_at < (NOW() - make_interval(hours => $2))
    `, [tenantId, hours]);

    let escalated = 0;
    for (const r of rows) {
      const raw = computeStatus(r.due_at, r.submitted_at || null, 60);
      const friendly = toPlain(raw);

      if (friendly !== "Late") continue; // only escalate truly late

      const subject = `Late task in ${r.project_name}: ${r.title}`;
      const body = `
        <p><strong>Project:</strong> ${r.project_name}</p>
        <p><strong>Task:</strong> ${r.title}</p>
        <p><strong>Status:</strong> ${statusPill(friendly)} (due ${new Date(r.due_at).toLocaleString()})</p>
        <p>This was escalated after being late for ${hours} hour(s).</p>
      `;
      const html = wrapEmail(body, "Escalation");

      const recipients = [r.manager_email, r.owner_email].filter(Boolean) as string[];
      for (const to of recipients) await sendEmail({ to, subject, html });

      if (r.supervisor_phone) {
        await sendSMS({ to: r.supervisor_phone, message: `Late task: '${r.title}' (${r.project_name}). Due ${new Date(r.due_at).toLocaleString()}.` });
      }
      escalated++;
    }
    return { tenantId, escalated, scanned: rows.length, hours };
  } finally {
    client.release();
  }
}
