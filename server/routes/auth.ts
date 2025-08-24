import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db";
import { generateAuthToken, verifyAuthToken } from "../tokens";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query(
      "SELECT id, org_id, email, name, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateAuthToken(user.id, user.org_id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const result = await query(
      "SELECT id, org_id, email, name, role FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;