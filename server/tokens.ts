import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const INVITE_SECRET = process.env.INVITE_SECRET || "change-this";

export function generateAuthToken(userId: string, orgId: string) {
  return jwt.sign({ userId, orgId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; orgId: string };
  } catch {
    return null;
  }
}

export function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function createInviteLink(token: string) {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:5173";
  return `${baseUrl}/accept-invite?token=${token}`;
}