import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { InvoiceStatusBar } from "@/components/invoice/invoice-status-bar";
import { getInvoice, getPlanContext, getSettings } from "@/lib/data";
import { planAllows } from "@/lib/plan";
import type { InvoiceDraft } from "@/lib/types";
import { updateInvoice } from "../actions";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, settings, { plan, trialEndsAt }] = await Promise.all([
    getInvoice(id),
    getSettings(),
    getPlanContext(),
  ]);
  if (!invoice) notFound();
  const quotesAllowed = planAllows(plan, "quotes", trialEndsAt);

  const initialDraft: InvoiceDraft = {
    doc_type: invoice.doc_type ?? "invoice",
    number: invoice.number,
    business_name: settings.business_name,
    business_address: settings.business_address,
    business_email: settings.from_email || settings.notify_email,
    client_name: invoice.client_name,
    client_email: invoice.client_email ?? "",
    client_address: invoice.client_address ?? "",
    issue_date: invoice.issue_date,
    due_date: invoice.due_date ?? "",
    currency: invoice.currency,
    tax_rate: Number(invoice.tax_rate),
    discount: Number(invoice.discount),
    items: invoice.items.length > 0 ? invoice.items : [{ description: "", qty: 1, unit_price: 0 }],
    notes: invoice.notes ?? "",
  };

  const saveAction = updateInvoice.bind(null, invoice.id);

  return (
    <div className="space-y-6">
      <div className="print-hidden">
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          ← All invoices
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
          {invoice.doc_type === "quote" ? "Quote" : "Invoice"} {invoice.number}
        </h1>
      </div>
      <InvoiceStatusBar invoiceId={invoice.id} status={invoice.status} docType={invoice.doc_type} />
      <InvoiceEditor
        initialDraft={initialDraft}
        saveAction={saveAction}
        saveLabel="Save changes"
        quotesAllowed={quotesAllowed}
      />
    </div>
  );
}
