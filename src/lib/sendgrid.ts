// lib/email.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import sgMail from "@sendgrid/mail";

type SendRegistrationEmailArgs = {
  name: string;
  email: string;
  city?: string | null;
  date?: string | Date | null;
};

function getInviteTemplateIdForCity(city?: string | null): string | undefined {
  const c = city?.toLowerCase().trim();

  if (c === "abuja") {
    return process.env.INVITE_TEMPLATE_ABUJA;
  }

  if (c === "owerri") {
    return process.env.INVITE_TEMPLATE_OWERRI;
  }

  // fallback – you can add INVITE_TEMPLATE_DEFAULT if you want
  return process.env.INVITE_TEMPLATE_ID;
}

export async function sendRegistrationEmail({
  name,
  email,
  city,
  date,
}: SendRegistrationEmailArgs) {
  const apiKey = process.env.SEND_GRID_KEY;
  const templateId = getInviteTemplateIdForCity(city);

  if (!apiKey || !templateId) {
    console.error("Missing sendgrid env vars or templateId");
    return;
  }

  sgMail.setApiKey(apiKey);

  // Format date nicely for the template
  let formattedDate: string | undefined;
  if (date) {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }

  const msg = {
    to: email,
    from: {
      name: "Guinness Match Day",
      email: "noreply@guinnessmatchday.com",
    },
    templateId,
    dynamicTemplateData: {
      name,
      city,
      date: formattedDate,
      subject: "Registration Successful – Guinness Match Day",
    },
  };

  try {
    await sgMail.send(msg);
  } catch (err: any) {
    console.error("SendGrid error", err?.response || err);
  }
}
