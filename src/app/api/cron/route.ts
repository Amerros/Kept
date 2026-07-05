import { getAdminSupabase } from "@/lib/supabase/admin";
import { renderTemplate, sendOwnerEmail } from "@/lib/email";

/**
 * Follow-up worker. Hit this on a schedule (e.g. Vercel Cron, every 5 min):
 *   GET /api/cron  with  Authorization: Bearer <CRON_SECRET>
 *
 * Processes due lf_follow_ups. v1 is owner-only:
 *   - channel "reminder" → email to the OWNER's notify_email
 *   - any customer-facing channel (email/sms/whatsapp to the lead) → skipped
 */

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "CRON_SECRET not set" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return Response.json({ ok: false, error: "Supabase not configured" }, { status: 503 });
  }

  const { data: due, error } = await supabase
    .from("lf_follow_ups")
    .select("id,business_id,lead_id,kind,channel,template,attempts")
    .eq("status", "pending")
    .lte("run_at", new Date().toISOString())
    .order("run_at")
    .limit(50);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let cancelled = 0;

  for (const job of due ?? []) {
    // v1 owner-only guard: customer-facing sends do not run yet, full stop.
    if (job.channel !== "reminder") {
      await supabase
        .from("lf_follow_ups")
        .update({ status: "skipped", error: "customer channels are disabled in v1" })
        .eq("id", job.id);
      skipped++;
      continue;
    }

    const { data: lead } = await supabase
      .from("lf_leads")
      .select("id,name,email,phone,status,message")
      .eq("id", job.lead_id)
      .maybeSingle();

    // Lead gone or already handled → nothing to nag about.
    if (!lead || lead.status !== "new") {
      await supabase.from("lf_follow_ups").update({ status: "cancelled" }).eq("id", job.id);
      cancelled++;
      continue;
    }

    const { data: settings } = await supabase
      .from("lf_settings")
      .select("notify_email,reminder_enabled")
      .eq("business_id", job.business_id)
      .maybeSingle();

    if (!settings?.reminder_enabled || !settings.notify_email) {
      await supabase
        .from("lf_follow_ups")
        .update({ status: "skipped", error: "owner reminders disabled or no notify email" })
        .eq("id", job.id);
      skipped++;
      continue;
    }

    const leadLabel = lead.name || lead.email || lead.phone || "A lead";
    const text = [
      renderTemplate(job.template, { name: leadLabel }),
      "",
      lead.message ? `Their message: “${lead.message}”` : null,
      lead.email ? `Email: ${lead.email}` : null,
      lead.phone ? `Phone: ${lead.phone}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n");

    const result = await sendOwnerEmail({
      to: settings.notify_email,
      subject: `Reminder: ${leadLabel} is waiting`,
      text,
    });

    await supabase.from("lf_messages").insert({
      business_id: job.business_id,
      lead_id: lead.id,
      direction: "outbound",
      channel: "reminder",
      to_addr: settings.notify_email,
      body: text,
      status: result.sent ? "sent" : "failed",
      provider_id: result.sent ? result.providerId : null,
      error: "error" in result ? result.error : result.sent ? null : "email not configured (skipped)",
    });

    if (result.sent || ("skipped" in result && result.skipped)) {
      await supabase
        .from("lf_follow_ups")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: job.attempts + 1,
          error: result.sent ? null : "email not configured — logged only",
        })
        .eq("id", job.id);
      sent++;
    } else {
      const attempts = job.attempts + 1;
      await supabase
        .from("lf_follow_ups")
        .update({
          // Retry up to 3 times on provider errors, then give up.
          status: attempts >= 3 ? "failed" : "pending",
          attempts,
          error: "error" in result ? result.error : "send failed",
        })
        .eq("id", job.id);
      failed++;
    }
  }

  // ── Weekly digest (Pro): Monday summary of the last 7 days ────────────────
  let digests = 0;
  if (new Date().getUTCDay() === 1) {
    const cutoff = new Date(Date.now() - 6 * 86_400_000).toISOString();
    const { data: candidates } = await supabase
      .from("lf_settings")
      .select("business_id,notify_email,weekly_digest_enabled,last_digest_at")
      .eq("weekly_digest_enabled", true)
      .or(`last_digest_at.is.null,last_digest_at.lt.${cutoff}`)
      .limit(100);

    for (const c of candidates ?? []) {
      if (!c.notify_email) continue;

      const { data: biz } = await supabase
        .from("lf_businesses")
        .select("name,plan,trial_ends_at")
        .eq("id", c.business_id)
        .maybeSingle();
      if (!biz) continue;
      // Pro feature; active trials get it too.
      const trialActive =
        biz.plan === "trial" && biz.trial_ends_at && new Date(biz.trial_ends_at) > new Date();
      if (biz.plan !== "pro" && !trialActive) continue;

      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const [{ data: leads }, { data: paid }] = await Promise.all([
        supabase
          .from("lf_leads")
          .select("status,created_at")
          .eq("business_id", c.business_id)
          .gte("created_at", since),
        supabase
          .from("lf_invoices")
          .select("items,tax_rate,discount")
          .eq("business_id", c.business_id)
          .eq("doc_type", "invoice")
          .eq("status", "paid")
          .gte("paid_at", since),
      ]);

      const newLeads = (leads ?? []).length;
      const won = (leads ?? []).filter((l) => l.status === "won").length;
      const revenue = (paid ?? []).reduce((sum, inv) => {
        const items = (inv.items ?? []) as { qty: number; unit_price: number }[];
        const sub = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
        const after = Math.max(0, sub - (Number(inv.discount) || 0));
        return sum + after * (1 + (Number(inv.tax_rate) || 0) / 100);
      }, 0);

      const result = await sendOwnerEmail({
        to: c.notify_email,
        subject: `Your week at ${biz.name}: ${newLeads} new lead${newLeads === 1 ? "" : "s"}, ${won} won`,
        text: [
          `Here's your Kept week in review:`,
          "",
          `• New leads: ${newLeads}`,
          `• Jobs won: ${won}`,
          `• Revenue collected: ${revenue.toFixed(2)}`,
          "",
          `Open your pipeline: ${process.env.APP_URL || "https://rkept.com"}/dashboard`,
        ].join("\n"),
      });

      await supabase
        .from("lf_settings")
        .update({ last_digest_at: new Date().toISOString() })
        .eq("business_id", c.business_id);
      if (result.sent) digests++;
    }
  }

  // ── Overdue invoice alerts (Pro): one email per invoice, when it slips ────
  let overdueAlerts = 0;
  const today = new Date().toISOString().slice(0, 10);
  const { data: overdueInvoices } = await supabase
    .from("lf_invoices")
    .select("id,business_id,number,client_name,items,tax_rate,discount,currency,due_date")
    .eq("status", "sent")
    .eq("doc_type", "invoice")
    .is("overdue_notified_at", null)
    .lt("due_date", today)
    .limit(50);

  for (const inv of overdueInvoices ?? []) {
    const { data: biz } = await supabase
      .from("lf_businesses")
      .select("name,plan,trial_ends_at")
      .eq("id", inv.business_id)
      .maybeSingle();
    const trialActive =
      biz?.plan === "trial" && biz.trial_ends_at && new Date(biz.trial_ends_at) > new Date();
    if (!biz || (biz.plan !== "pro" && !trialActive)) continue;

    const { data: st } = await supabase
      .from("lf_settings")
      .select("notify_email")
      .eq("business_id", inv.business_id)
      .maybeSingle();
    if (!st?.notify_email) continue;

    const items = (inv.items ?? []) as { qty: number; unit_price: number }[];
    const sub = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
    const total =
      Math.max(0, sub - (Number(inv.discount) || 0)) * (1 + (Number(inv.tax_rate) || 0) / 100);

    const result = await sendOwnerEmail({
      to: st.notify_email,
      subject: `Overdue: invoice ${inv.number} (${inv.currency} ${total.toFixed(2)})`,
      text: [
        `Invoice ${inv.number} for ${inv.client_name || "your client"} was due ${inv.due_date} and hasn't been marked paid.`,
        "",
        `Amount: ${inv.currency} ${total.toFixed(2)}`,
        "",
        `Chase it or mark it paid: ${process.env.APP_URL || "https://rkept.com"}/dashboard/invoices/${inv.id}`,
      ].join("\n"),
    });

    await supabase
      .from("lf_invoices")
      .update({ overdue_notified_at: new Date().toISOString() })
      .eq("id", inv.id);
    if (result.sent) overdueAlerts++;
  }

  return Response.json({
    ok: true,
    processed: (due ?? []).length,
    sent,
    skipped,
    cancelled,
    failed,
    digests,
    overdueAlerts,
  });
}
