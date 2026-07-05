"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPlanContext } from "@/lib/data";
import { planAllows, upgradeMessage } from "@/lib/plan";
import type { LeadSource, LeadStatus } from "@/lib/types";

const VALID_STATUSES: LeadStatus[] = ["new", "contacted", "won", "lost"];

/**
 * Move a lead to a new pipeline status.
 * Demo mode (no Supabase keys): returns { demo: true } and the client keeps
 * its optimistic state so the pipeline is still fully playable.
 */
export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false as const, error: "Invalid status" };
  }

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // RLS guarantees the lead belongs to this owner's business.
  const patch: Record<string, unknown> = { status };
  if (status === "contacted") patch.last_contacted_at = new Date().toISOString();

  const { error } = await supabase.from("lf_leads").update(patch).eq("id", leadId);
  if (error) return { ok: false as const, error: error.message };

  // Answered or closed → pending automated reminders stop.
  if (status !== "new") {
    await supabase
      .from("lf_follow_ups")
      .update({ status: "cancelled" })
      .eq("lead_id", leadId)
      .eq("status", "pending");
  }

  revalidatePath("/dashboard");
  return { ok: true as const, demo: false };
}

/** Add a lead by hand (phone call, walk-in, referral…). */
export async function addLead(input: {
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: LeadSource;
}) {
  const name = input.name?.trim();
  if (!name) return { ok: false as const, error: "Name is required" };

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

  const { error } = await supabase.from("lf_leads").insert({
    business_id: business.id,
    name,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
    source: input.source ?? "manual",
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true as const, demo: false };
}

/** "Remind me about this lead again in X" — schedules a one-off owner reminder. */
export async function snoozeLead(leadId: string, minutes: number) {
  const mins = Math.min(Math.max(Math.round(minutes), 5), 60 * 24 * 30); // 5 min – 30 days
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: business } = await supabase.from("lf_businesses").select("id").maybeSingle();
  if (!business) return { ok: false as const, error: "Business not found" };

  const { error } = await supabase.from("lf_follow_ups").insert({
    business_id: business.id,
    lead_id: leadId,
    kind: "reminder",
    channel: "reminder",
    template: "You snoozed {{name}} — time to pick this one back up.",
    run_at: new Date(Date.now() + mins * 60_000).toISOString(),
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/dashboard/leads/${leadId}`);
  return { ok: true as const, demo: false };
}

/** Book (or clear) the appointment date/time on a lead. */
export async function setAppointment(leadId: string, iso: string | null) {
  if (iso && Number.isNaN(new Date(iso).getTime())) {
    return { ok: false as const, error: "Invalid date" };
  }

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("lf_leads")
    .update({ appointment_at: iso })
    .eq("id", leadId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard");
  return { ok: true as const, demo: false };
}

/** Save the owner's private notes on a lead. */
export async function saveLeadNotes(leadId: string, notes: string) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { plan, trialEndsAt } = await getPlanContext();
  if (!planAllows(plan, "lead_notes", trialEndsAt)) {
    return { ok: false as const, error: upgradeMessage("lead_notes") };
  }

  const { error } = await supabase
    .from("lf_leads")
    .update({ notes: notes.trim() || null })
    .eq("id", leadId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/dashboard/leads/${leadId}`);
  return { ok: true as const, demo: false };
}
