/**
 * Minimal transactional email via Resend's HTTP API.
 * Requires RESEND_API_KEY and EMAIL_FROM (e.g. "ReflectAI <hello@reflectai.net>").
 * Without them, the email is logged instead of sent so local dev still works.
 */
export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[email] RESEND_API_KEY/EMAIL_FROM not set; not sending "${subject}" to ${to}:\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!res.ok) {
    console.error(`[email] Resend rejected "${subject}" to ${to}: ${res.status} ${await res.text()}`);
    throw new Error("Failed to send email");
  }
}
