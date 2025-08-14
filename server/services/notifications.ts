import axios from "axios";

type EmailOptions = { to: string; subject: string; html: string };
type SMSOptions = { to: string; message: string };

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@safetysync.ai";

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM;

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!BREVO_API_KEY) {
    console.warn("[notifications] BREVO_API_KEY not set; skipping email.");
    return { skipped: true };
  }
  try {
    const res = await axios.post("https://api.brevo.com/v3/smtp/email", {
      sender: { email: FROM_EMAIL, name: "SafetySync.ai" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }, {
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
      timeout: 12_000,
    });
    return res.data;
  } catch (err: any) {
    console.error("[notifications] email error", err?.response?.data || err?.message);
    return { error: true };
  }
}

export async function sendSMS({ to, message }: SMSOptions) {
  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    console.warn("[notifications] Twilio not configured; skipping SMS.");
    return { skipped: true };
  }
  const basic = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  try {
    const res = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      new URLSearchParams({ From: TWILIO_FROM, To: to, Body: message }),
      { headers: { Authorization: `Basic ${basic}` } }
    );
    return res.data;
  } catch (err: any) {
    console.error("[notifications] sms error", err?.response?.data || err?.message);
    return { error: true };
  }
}
