/**
 * Owner-notification email sender (Resend).
 * v1 is owner-only: this is the ONLY way Kept sends anything, and it always
 * goes to the business owner — never to a lead/customer.
 *
 * Without RESEND_API_KEY the send is skipped (and logged as such) so the whole
 * pipeline stays testable before email is wired up.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
// rkept.com is a verified Resend sending domain, so this default works in prod
// even if the EMAIL_FROM env var is unset. Override it to change the from-name.
const EMAIL_FROM = process.env.EMAIL_FROM || "Kept <hello@rkept.com>";

export type SendResult =
  | { sent: true; providerId: string | null }
  | { sent: false; skipped: true }
  | { sent: false; skipped?: false; error: string };

export async function sendOwnerEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<SendResult> {
  if (!RESEND_API_KEY) return { sent: false, skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { sent: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = (await res.json()) as { id?: string };
    return { sent: true, providerId: data.id ?? null };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "send failed" };
  }
}

/** Fill {{name}}-style placeholders in a template. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}
