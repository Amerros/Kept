"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPlanContext } from "@/lib/data";
import { planAllows, upgradeMessage } from "@/lib/plan";
import type { InvoiceDraft, InvoiceStatus } from "@/lib/types";

const VALID_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "void"];

function draftToRow(draft: InvoiceDraft) {
  return {
    doc_type: draft.doc_type === "quote" ? "quote" : "invoice",
    number: draft.number.trim() || "INV-0001",
    client_name: draft.client_name.trim(),
    client_email: draft.client_email.trim() || null,
    client_address: draft.client_address.trim() || null,
    issue_date: draft.issue_date || new Date().toISOString().slice(0, 10),
    due_date: draft.due_date || null,
    currency: draft.currency || "EUR",
    tax_rate: Number.isFinite(draft.tax_rate) ? draft.tax_rate : 0,
    discount: Number.isFinite(draft.discount) ? draft.discount : 0,
    items: draft.items
      .filter((it) => it.description.trim() !== "" || Number(it.unit_price) > 0)
      .map((it) => ({
        description: it.description.trim(),
        qty: Number(it.qty) || 0,
        unit_price: Number(it.unit_price) || 0,
      })),
    notes: draft.notes.trim() || null,
  };
}

export async function createInvoice(draft: InvoiceDraft) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  if (draft.doc_type === "quote") {
    const { plan, trialEndsAt } = await getPlanContext();
    if (!planAllows(plan, "quotes", trialEndsAt)) {
      return { ok: false as const, error: upgradeMessage("quotes") };
    }
  }

  const { data: business, error: bizErr } = await supabase
    .from("lf_businesses")
    .select("id")
    .maybeSingle();
  if (bizErr || !business) return { ok: false as const, error: "Business not found" };

  const { data, error } = await supabase
    .from("lf_invoices")
    .insert({ business_id: business.id, ...draftToRow(draft) })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false as const,
      error: error.code === "23505" ? "That invoice number already exists." : error.message,
    };
  }

  revalidatePath("/dashboard/invoices");
  return { ok: true as const, id: data.id as string };
}

export async function updateInvoice(id: string, draft: InvoiceDraft) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase.from("lf_invoices").update(draftToRow(draft)).eq("id", id);
  if (error) {
    return {
      ok: false as const,
      error: error.code === "23505" ? "That invoice number already exists." : error.message,
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return { ok: true as const };
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  if (!VALID_STATUSES.includes(status)) return { ok: false as const, error: "Invalid status" };

  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("lf_invoices")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return { ok: true as const };
}

/** One-click copy: new draft with the next available number, same everything else. */
export async function duplicateInvoice(id: string) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: src, error: srcErr } = await supabase
    .from("lf_invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (srcErr || !src) return { ok: false as const, error: "Invoice not found" };

  const { count } = await supabase
    .from("lf_invoices")
    .select("id", { count: "exact", head: true });
  const prefix = (src.number as string).replace(/-?\d+$/, "") || "INV";
  const number = `${prefix.replace(/-$/, "")}-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data, error } = await supabase
    .from("lf_invoices")
    .insert({
      business_id: src.business_id,
      doc_type: src.doc_type,
      number,
      status: "draft",
      client_name: src.client_name,
      client_email: src.client_email,
      client_address: src.client_address,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: null,
      currency: src.currency,
      tax_rate: src.tax_rate,
      discount: src.discount,
      items: src.items,
      notes: src.notes,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/invoices");
  return { ok: true as const, id: data.id as string };
}

/** Turn an accepted quote into a real invoice (keeps everything, new status). */
export async function convertQuoteToInvoice(id: string) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("lf_invoices")
    .update({ doc_type: "invoice", status: "draft" })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  return { ok: true as const };
}

export async function deleteInvoice(id: string) {
  const supabase = await getServerSupabase();
  if (!supabase) return { ok: true as const, demo: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase.from("lf_invoices").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/dashboard/invoices");
  return { ok: true as const };
}
