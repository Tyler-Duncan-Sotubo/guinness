/* eslint-disable @typescript-eslint/no-explicit-any */
import sgMail from "@sendgrid/mail";

export async function sendRegistrationEmail(name: string, email: string) {
  if (!process.env.SEND_GRID_KEY || !process.env.INVITE_TEMPLATE_ID) {
    console.error("Missing sendgrid env vars");
    return;
  }

  sgMail.setApiKey(process.env.SEND_GRID_KEY);

  const msg = {
    to: email,
    from: {
      name: "Guinness Match Day",
      email: "noreply@guinnessmatchday.com",
    },
    templateId: process.env.INVITE_TEMPLATE_ID,
    dynamicTemplateData: {
      name,
      subject: "Registration Successful – Guinness Match Day",
    },
  };

  try {
    await sgMail.send(msg);
  } catch (err: any) {
    console.error("SendGrid error", err?.response || err);
  }
}
