import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendOwnerEmail } from "@/lib/email";

/**
 * Public lead intake endpoint. The owner embeds a form on their own website
 * that POSTs here with their intake_key (safe to expose — it only allows
 * creating leads, never reading anything).
 *
 * v1 is owner-only: a new lead triggers an email alert TO THE OWNER and
 * schedules owner reminders. Nothing is ever sent to the lead.
 *
 * Accepts JSON or a classic form post. Form posts may include a `redirect`
 * field (URL of the thank-you page on the owner's site).
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const supabase = getAdminSupabase();
  if (!supabase) return json(503, { ok: false, error: "Not configured" });

  // Parse JSON or form-encoded body.
  const fields: Record<string, string> = {};
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(body)) fields[k] = String(v ?? "");
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) fields[k] = String(v);
    }
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const intakeKey = fields.intake_key?.trim();
  const name = fields.name?.trim();
  if (!intakeKey) return json(400, { ok: false, error: "Missing intake_key" });
  if (!name && !fields.email?.trim() && !fields.phone?.trim()) {
    return json(400, { ok: false, error: "Provide at least a name, email or phone" });
  }
  // Honeypot: bots fill every field; real forms leave this hidden one empty.
  if (fields._gotcha) return json(200, { ok: true });

  const { data: business } = await supabase
    .from("lf_businesses")
    .select("id,name")
    .eq("intake_key", intakeKey)
    .maybeSingle();
  if (!business) return json(404, { ok: false, error: "Unknown intake_key" });

  const source = ["website", "whatsapp", "email"].includes(fields.source)
    ? fields.source
    : "website";

  const { data: lead, error: leadErr } = await supabase
    .from("lf_leads")
    .insert({
      business_id: business.id,
      name: name || null,
      email: fields.email?.trim() || null,
      phone: fields.phone?.trim() || null,
      message: fields.message?.trim().slice(0, 4000) || null,
      source,
    })
    .select("id,name")
    .single();
  if (leadErr) return json(500, { ok: false, error: "Could not save lead" });

  // Log the enquiry itself.
  await supabase.from("lf_messages").insert({
    business_id: business.id,
    lead_id: lead.id,
    direction: "inbound",
    channel: source === "whatsapp" ? "whatsapp" : "email",
    from_addr: fields.email?.trim() || fields.phone?.trim() || null,
    body: fields.message?.trim().slice(0, 4000) || null,
    status: "received",
  });

  const { data: settings } = await supabase
    .from("lf_settings")
    .select("new_lead_alert_enabled,reminder_enabled,reminder_delay_minutes,notify_email")
    .eq("business_id", business.id)
    .maybeSingle();

  const leadLabel = lead.name || fields.email?.trim() || fields.phone?.trim() || "A new lead";

  // 1) Instant alert to the OWNER (v1: the only instant send there is).
  if (settings?.new_lead_alert_enabled && settings.notify_email) {
    const text = [
      `${leadLabel} just reached out to ${business.name}.`,
      "",
      fields.message?.trim() ? `“${fields.message.trim()}”` : "(no message)",
      "",
      fields.email?.trim() ? `Email: ${fields.email.trim()}` : null,
      fields.phone?.trim() ? `Phone: ${fields.phone.trim()}` : null,
      "",
      "Reply within the hour to win the job — leads go cold fast.",
    ]
      .filter((l) => l !== null)
      .join("\n");

    const result = await sendOwnerEmail({
      to: settings.notify_email,
      subject: `New lead: ${leadLabel}`,
      text,
    });

    await supabase.from("lf_messages").insert({
      business_id: business.id,
      lead_id: lead.id,
      direction: "outbound",
      channel: "reminder",
      to_addr: settings.notify_email,
      body: text,
      status: result.sent ? "sent" : "failed",
      provider_id: result.sent ? result.providerId : null,
      error: "error" in result ? result.error : result.sent ? null : "email not configured (skipped)",
    });
  }

  // 2) Owner reminders. v1 owner-only: ONLY reminder-channel steps are
  //    scheduled — customer-facing channels don't run yet.
  const now = Date.now();
  const followUps: Record<string, unknown>[] = [];

  if (settings?.reminder_enabled) {
    followUps.push({
      business_id: business.id,
      lead_id: lead.id,
      kind: "reminder",
      channel: "reminder",
      template: "{{name}} is still waiting for a personal reply from you.",
      run_at: new Date(now + (settings.reminder_delay_minutes || 30) * 60_000).toISOString(),
    });
  }

  const { data: steps } = await supabase
    .from("lf_followup_steps")
    .select("id,delay_minutes,channel,template")
    .eq("business_id", business.id)
    .eq("enabled", true)
    .eq("channel", "reminder")
    .order("step_order");

  for (const step of steps ?? []) {
    followUps.push({
      business_id: business.id,
      lead_id: lead.id,
      step_id: step.id,
      kind: "followup",
      channel: "reminder",
      template: step.template,
      run_at: new Date(now + step.delay_minutes * 60_000).toISOString(),
    });
  }

  if (followUps.length > 0) await supabase.from("lf_follow_ups").insert(followUps);

  // Classic form post → bounce back to the owner's thank-you page (absolute URL)
  // or to a page on this app (relative path, e.g. the hosted lead page).
  const redirect = fields.redirect?.trim();
  if (redirect && !contentType.includes("application/json")) {
    if (/^https?:\/\//.test(redirect)) return Response.redirect(redirect, 303);
    if (redirect.startsWith("/") && !redirect.startsWith("//")) {
      return Response.redirect(new URL(redirect, request.url), 303);
    }
  }

  return json(200, { ok: true, lead_id: lead.id });
}
