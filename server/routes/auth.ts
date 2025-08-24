import { Router } from "express";
import bcrypt from "bcryptjs";
import { verifyInvite } from "../tokens";
import { query } from "../db";

const r = Router();

r.post("/accept-invite", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "token and password required" });

  const payload = verifyInvite(token);
  if (!payload) return res.status(400).json({ error: "Invalid or expired token" });

  const inv = await query("SELECT * FROM invites WHERE token=$1", [token]);
  if (inv.rows.length === 0) return res.status(400).json({ error: "Invite not found" });
  const invite = inv.rows[0];
  if (invite.accepted_at) return res.status(400).json({ error: "Invite already accepted" });
  if (new Date(invite.expires_at) < new Date()) return res.status(400).json({ error: "Invite expired" });

  const userRes = await query("SELECT * FROM users WHERE email=$1", [payload.email]);
  const hash = await bcrypt.hash(password, 10);
  if (userRes.rows.length === 0) {
    await query(
      "INSERT INTO users (id, org_id, email, password_hash, role) VALUES (gen_random_uuid(), $1, $2, $3, 'member')",
      [payload.org_id, payload.email, hash]
    );
  } else {
    await query("UPDATE users SET password_hash=$1 WHERE email=$2", [hash, payload.email]);
  }

  await query("UPDATE invites SET accepted_at=now() WHERE token=$1", [token]);
  res.json({ ok: true });
});

export default r;