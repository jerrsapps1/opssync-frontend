import jwt from "jsonwebtoken";

const INVITE_SECRET = process.env.INVITE_SECRET || "dev-secret";

export function signInvite(payload: { email: string, org_id: string }) {
  return jwt.sign(payload, INVITE_SECRET, { expiresIn: "7d" });
}

export function verifyInvite(token: string) {
  try {
    return jwt.verify(token, INVITE_SECRET) as { email: string, org_id: string, iat: number, exp: number };
  } catch {
    return null;
  }
}