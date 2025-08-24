import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { query } from "../db";
import { generateInviteToken, createInviteLink } from "../tokens";
import { sendInviteEmail } from "../mailer";

const router = Router();

router.post("/", async (req, res) => {
  const { email, orgId } = req.body;

  try {
    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Check if invite already exists
    const existingInvite = await query(
      "SELECT id FROM invites WHERE email = $1 AND org_id = $2 AND accepted_at IS NULL",
      [email, orgId]
    );
    if (existingInvite.rows.length > 0) {
      return res.status(400).json({ error: "Invite already sent" });
    }

    // Check seat limit
    const orgResult = await query("SELECT name, seat_limit FROM organizations WHERE id = $1", [orgId]);
    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const org = orgResult.rows[0];
    const userCount = await query("SELECT COUNT(*) as count FROM users WHERE org_id = $1", [orgId]);
    const currentUsers = parseInt(userCount.rows[0].count);

    if (org.seat_limit !== -1 && currentUsers >= org.seat_limit) {
      return res.status(400).json({ error: "Seat limit reached" });
    }

    // Create invite
    const inviteId = uuidv4();
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(
      "INSERT INTO invites (id, org_id, email, token, expires_at) VALUES ($1, $2, $3, $4, $5)",
      [inviteId, orgId, email, token, expiresAt]
    );

    // Send email
    const inviteLink = createInviteLink(token);
    await sendInviteEmail(email, inviteLink, org.name);

    res.json({ success: true, inviteLink });
  } catch (error) {
    console.error("Invite error:", error);
    res.status(500).json({ error: "Failed to send invite" });
  }
});

router.post("/accept", async (req, res) => {
  const { token, name, password } = req.body;

  try {
    // Find invite
    const inviteResult = await query(
      "SELECT * FROM invites WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()",
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired invite" });
    }

    const invite = inviteResult.rows[0];

    // Create user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      "INSERT INTO users (id, org_id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, invite.org_id, invite.email, name, hashedPassword, "member"]
    );

    // Mark invite as accepted
    await query("UPDATE invites SET accepted_at = NOW() WHERE id = $1", [invite.id]);

    res.json({ success: true });
  } catch (error) {
    console.error("Accept invite error:", error);
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

export default router;