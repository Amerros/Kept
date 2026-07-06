import {
  DEMO_FOLLOWUPS,
  DEMO_INVOICES,
  DEMO_LEADS,
  DEMO_LEADS_PER_DAY,
  DEMO_MESSAGES,
  DEMO_SETTINGS,
  DEMO_STEPS,
} from "./demo-data";
import { isSupabaseConfigured } from "./supabase/config";
import { getServerSupabase } from "./supabase/server";
import type {
  BusinessSettings,
  FollowUp,
  FollowupStep,
  Invoice,
  Lead,
  Message,
  Plan,
} from "./types";

/**
 * Data access layer. Every read goes through here:
 * - Supabase configured → real queries (RLS scopes rows to the signed-in owner).
 * - No keys yet → demo data, so the app is fully browsable out of the box.
 *
 * All LeadFlow tables are prefixed lf_ — this Supabase project is shared with
 * other apps and their tables must never be touched.
 */

export const isDemoMode = !isSupabaseConfigured;

const LEAD_COLUMNS =
  "id,name,email,phone,source,message,status,notes,appointment_at,created_at,last_contacted_at";

export async function getLeads(): Promise<Lead[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_LEADS;

  const { data, error } = await supabase
    .from("lf_leads")
    .select(LEAD_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load leads: ${error.message}`);
  return (data ?? []) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_LEADS.find((l) => l.id === id) ?? null;

  const { data, error } = await supabase
    .from("lf_leads")
    .select(LEAD_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  return data as Lead | null;
}

export async function getMessagesForLead(leadId: string): Promise<Message[]> {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return DEMO_MESSAGES.filter((m) => m.lead_id === leadId).sort(
      (a, b) => a.created_at.localeCompare(b.created_at)
    );
  }

  const { data, error } = await supabase
    .from("lf_messages")
    .select("id,lead_id,direction,channel,body,status,created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return (data ?? []) as Message[];
}

export async function getFollowUpsForLead(leadId: string): Promise<FollowUp[]> {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return DEMO_FOLLOWUPS.filter((f) => f.lead_id === leadId).sort((a, b) =>
      a.run_at.localeCompare(b.run_at)
    );
  }

  const { data, error } = await supabase
    .from("lf_follow_ups")
    .select("id,lead_id,kind,channel,template,run_at,status")
    .eq("lead_id", leadId)
    .order("run_at", { ascending: true });

  if (error) throw new Error(`Failed to load follow-ups: ${error.message}`);
  return (data ?? []) as FollowUp[];
}

export async function getSettings(): Promise<BusinessSettings> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_SETTINGS;

  const { data: business, error: bizErr } = await supabase
    .from("lf_businesses")
    .select("id,name,intake_key,calendar_key,plan,trial_ends_at")
    .maybeSingle();
  if (bizErr || !business) return DEMO_SETTINGS;

  const { data, error } = await supabase
    .from("lf_settings")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  if (error || !data) return DEMO_SETTINGS;

  return {
    business_id: business.id,
    business_name: business.name,
    intake_key: business.intake_key,
    calendar_key: business.calendar_key ?? "",
    webhook_url: data.webhook_url ?? "",
    plan: business.plan ?? "trial",
    trial_ends_at: business.trial_ends_at ?? null,
    instant_reply_enabled: data.instant_reply_enabled,
    instant_reply_channel: data.instant_reply_channel,
    instant_reply_template: data.instant_reply_template,
    new_lead_alert_enabled: data.new_lead_alert_enabled,
    reminder_enabled: data.reminder_enabled,
    reminder_delay_minutes: data.reminder_delay_minutes,
    notify_email: data.notify_email ?? "",
    from_email: data.from_email ?? "",
    business_address: data.business_address ?? "",
    whatsapp_from: data.whatsapp_from ?? "",
    sms_from: data.sms_from ?? "",
    sms_addon_enabled: Boolean(data.sms_from),
    invoice_prefix: data.invoice_prefix ?? "INV",
    invoice_currency: data.invoice_currency ?? "EUR",
    invoice_tax_rate: Number(data.invoice_tax_rate ?? 21),
    invoice_footer: data.invoice_footer ?? "",
    reply_templates: Array.isArray(data.reply_templates)
      ? (data.reply_templates as string[])
      : [],
    weekly_digest_enabled: data.weekly_digest_enabled ?? true,
    price_book: Array.isArray(data.price_book) ? data.price_book : [],
    page_enabled: data.page_enabled ?? true,
    page_tagline: data.page_tagline ?? "",
    page_services: data.page_services ?? "",
  };
}

/** Current plan + trial end for the signed-in owner (for feature gating). */
export async function getPlanContext(): Promise<{
  plan: Plan;
  trialEndsAt: string | null;
  businessId: string | null;
}> {
  const supabase = await getServerSupabase();
  if (!supabase) return { plan: "trial", trialEndsAt: null, businessId: null };

  const { data } = await supabase
    .from("lf_businesses")
    .select("id,plan,trial_ends_at")
    .maybeSingle();
  return {
    plan: (data?.plan as Plan) ?? "trial",
    trialEndsAt: data?.trial_ends_at ?? null,
    businessId: data?.id ?? null,
  };
}

export async function getFollowupSteps(): Promise<FollowupStep[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_STEPS;

  const { data, error } = await supabase
    .from("lf_followup_steps")
    .select("id,step_order,delay_minutes,channel,template,enabled")
    .order("step_order", { ascending: true });

  if (error) throw new Error(`Failed to load follow-up steps: ${error.message}`);
  return (data ?? []) as FollowupStep[];
}

export async function getLeadsPerDay(): Promise<{ date: string; count: number }[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_LEADS_PER_DAY;

  const since = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("lf_leads")
    .select("created_at")
    .gte("created_at", since);

  if (error) throw new Error(`Failed to load lead trend: ${error.message}`);

  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    byDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    if (byDay.has(day)) byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return [...byDay.entries()].map(([date, count]) => ({ date, count }));
}

const INVOICE_COLUMNS =
  "id,number,status,doc_type,recurs,next_recurrence,client_name,client_email,client_address,issue_date,due_date,currency,tax_rate,discount,items,notes,paid_at,created_at";

export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_INVOICES;

  const { data, error } = await supabase
    .from("lf_invoices")
    .select(INVOICE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load invoices: ${error.message}`);
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return DEMO_INVOICES.find((i) => i.id === id) ?? null;

  const { data, error } = await supabase
    .from("lf_invoices")
    .select(INVOICE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load invoice: ${error.message}`);
  return data as Invoice | null;
}

/** Next sequential invoice number for the signed-in owner, e.g. "INV-0007". */
export async function getNextInvoiceNumber(prefix: string): Promise<string> {
  const supabase = await getServerSupabase();
  if (!supabase) return `${prefix}-${String(DEMO_INVOICES.length + 1).padStart(4, "0")}`;

  const { count } = await supabase
    .from("lf_invoices")
    .select("id", { count: "exact", head: true });

  return `${prefix}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}
