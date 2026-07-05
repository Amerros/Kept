"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPlanContext } from "@/lib/data";
import { planAllows } from "@/lib/plan";
import type { BusinessSettings, FollowupStep } from "@/lib/types";

/**
 * Persist settings + follow-up sequence.
 * Demo mode: succeed without persisting so the UI flow is fully testable.
 */
export async function saveSettings(settings: BusinessSettings, steps: FollowupStep[]) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: business, error: bizErr } = await supabase
    .from("lf_businesses")
    .select("id")
    .maybeSingle();
  if (bizErr || !business) return { ok: false as const, error: "Business not found" };

  const { error: nameErr } = await supabase
    .from("lf_businesses")
    .update({ name: settings.business_name })
    .eq("id", business.id);
  if (nameErr) return { ok: false as const, error: nameErr.message };

  const { plan, trialEndsAt } = await getPlanContext();

  const { error: setErr } = await supabase
    .from("lf_settings")
    .update({
      instant_reply_enabled: settings.instant_reply_enabled,
      instant_reply_channel: settings.instant_reply_channel,
      instant_reply_template: settings.instant_reply_template,
      new_lead_alert_enabled: settings.new_lead_alert_enabled,
      reminder_enabled: settings.reminder_enabled,
      reminder_delay_minutes: settings.reminder_delay_minutes,
      notify_email: settings.notify_email || null,
      from_email: settings.from_email || null,
      business_address: settings.business_address || null,
      whatsapp_from: settings.whatsapp_from || null,
      sms_from: settings.sms_addon_enabled ? settings.sms_from || null : null,
      invoice_prefix: settings.invoice_prefix?.trim() || "INV",
      invoice_currency: settings.invoice_currency?.trim() || "EUR",
      invoice_tax_rate: Number.isFinite(settings.invoice_tax_rate)
        ? settings.invoice_tax_rate
        : 21,
      invoice_footer: settings.invoice_footer || null,
      reply_templates: (settings.reply_templates ?? [])
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5),
      weekly_digest_enabled: settings.weekly_digest_enabled,
      page_enabled: settings.page_enabled,
      // Customising the hosted page is Standard+; Solo keeps name + form only.
      ...(planAllows(plan, "page_customize", trialEndsAt)
        ? {
            page_tagline: settings.page_tagline?.trim() || null,
            page_services: settings.page_services?.trim() || null,
          }
        : {}),
    })
    .eq("business_id", business.id);
  if (setErr) return { ok: false as const, error: setErr.message };

  // Editing the reminder sequence is a Standard+ feature. Solo keeps the
  // default sequence, so we simply skip persisting step edits for them.
  if (planAllows(plan, "custom_sequence", trialEndsAt)) {
    for (const step of steps) {
      const { error } = await supabase
        .from("lf_followup_steps")
        .update({
          delay_minutes: step.delay_minutes,
          channel: step.channel,
          template: step.template,
          enabled: step.enabled,
        })
        .eq("id", step.id);
      if (error) return { ok: false as const, error: error.message };
    }
  }

  revalidatePath("/dashboard/settings");
  return { ok: true as const, demo: false };
}

/** Remove the owner's Gmail connection (revokes nothing at Google; send-only scope). */
export async function disconnectGmail() {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // RLS limits the delete to the owner's own row.
  const { error } = await supabase.from("lf_email_connections").delete().neq("provider", "");
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/settings");
  return { ok: true as const, demo: false };
}
