import sendgrid from "sendgrid";
const sgKey = process.env.SENDGRID_API_KEY || "";

export async function sendInviteEmail(to: string, acceptUrl: string) {
  if (!sgKey) {
    console.log(`[mailer] SENDGRID_API_KEY missing. Would send invite to ${to}: ${acceptUrl}`);
    return { mocked: true };
  }
  const sg = sendgrid(sgKey);
  const request = sg.emptyRequest({
    method: "POST",
    path: "/v3/mail/send",
    body: {
      personalizations: [{ to: [{ email: to }], subject: "You're invited to OpsSync.ai" }],
      from: { email: process.env.EMAIL_FROM || "no-reply@opssync.ai", name: "OpsSync.ai" },
      content: [{
        type: "text/plain",
        value: `You've been granted access to OpsSync.ai.\n\nCreate your password: ${acceptUrl}\n`
      }]
    }
  });
  const res = await sg.API(request);
  return res;
}