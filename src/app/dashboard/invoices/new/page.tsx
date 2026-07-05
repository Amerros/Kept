import type { Metadata } from "next";
import Link from "next/link";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { getNextInvoiceNumber, getPlanContext, getSettings } from "@/lib/data";
import { isoDateWithOffset } from "@/lib/format";
import { planAllows } from "@/lib/plan";
import type { InvoiceDraft } from "@/lib/types";
import { createInvoice } from "../actions";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const [settings, { plan, trialEndsAt }] = await Promise.all([getSettings(), getPlanContext()]);
  const number = await getNextInvoiceNumber(settings.invoice_prefix);
  const quotesAllowed = planAllows(plan, "quotes", trialEndsAt);

  const today = isoDateWithOffset(0);
  const due = isoDateWithOffset(14);

  const initialDraft: InvoiceDraft = {
    doc_type: "invoice",
    number,
    business_name: settings.business_name,
    business_address: settings.business_address,
    business_email: settings.from_email || settings.notify_email,
    client_name: "",
    client_email: "",
    client_address: "",
    issue_date: today,
    due_date: due,
    currency: settings.invoice_currency,
    tax_rate: settings.invoice_tax_rate,
    discount: 0,
    items: [{ description: "", qty: 1, unit_price: 0 }],
    notes: settings.invoice_footer,
  };

  return (
    <div className="space-y-6">
      <div className="print-hidden">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          ← All invoices
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">New invoice</h1>
        <p className="mt-1 text-sm text-ink-2">
          Fill it in on the left, watch it build on the right. Print or save as PDF any time.
        </p>
      </div>
      <InvoiceEditor
        initialDraft={initialDraft}
        saveAction={createInvoice}
        saveLabel="Save"
        quotesAllowed={quotesAllowed}
      />
    </div>
  );
}
