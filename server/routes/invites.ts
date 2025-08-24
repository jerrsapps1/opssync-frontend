import { Router } from "express";
import crypto from "crypto";
import { query } from "../db";
import { getOrg } from "../startup";
import { signInvite } from "../tokens";
import { sendInviteEmail } from "../mailer";

const r = Router();

r.post("/", async (req, res) => {
  const { emails } = req.body || {};
  if (!Array.isArray(emails) || emails.length === 0) return res.status(400).json({ error: "emails required" });

  const org = await getOrg();
  const seatsUsed = Number(org.seats_used || 0);
  const remaining = Number(org.seat_limit) - seatsUsed;
  if (emails.length > remaining) {
    return res.status(400).json({ error: `Not enough seats. Remaining: ${remaining}` });
  }

  let sent = 0;
  for (const email of emails) {
    const token = signInvite({ email, org_id: org.id });
    const expires = new Date(Date.now() + 7*24*3600*1000);
    await query(
      "INSERT INTO invites (id, org_id, email, token, expires_at) VALUES ($1,$2,$3,$4,$5)",
      [crypto.randomUUID(), org.id, email, token, expires]
    );

    const base = process.env.APP_BASE_URL || "http://localhost:5173";
    const url = `${base}/accept-invite?token=${encodeURIComponent(token)}`;
    await sendInviteEmail(email, url);
    sent++;
  }

  res.json({ ok: true, sent });
});

export default r;