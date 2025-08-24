import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendInviteEmail(email: string, inviteLink: string, orgName: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log(`Would send invite email to ${email}: ${inviteLink}`);
    return;
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || "no-reply@opssync.ai",
    subject: `You're invited to join ${orgName}`,
    html: `
      <h2>You're invited to join ${orgName}</h2>
      <p>Click the link below to accept your invitation:</p>
      <a href="${inviteLink}">Accept Invitation</a>
      <p>This link will expire in 7 days.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Invite email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}