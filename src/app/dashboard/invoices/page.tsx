import type { Metadata } from "next";
import Link from "next/link";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatTile } from "@/components/dashboard/stat-tile";
import { InvoicesToolbar } from "@/components/invoice/invoices-toolbar";
import { getInvoices, getPlanContext } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { planAllows } from "@/lib/plan";
import { INVOICE_STATUS_LABELS, invoiceTotals, type Invoice } from "@/lib/types";

export const metadata: Metadata = { title: "Invoices" };

const STATUS_BADGE: Record<Invoice["status"], string> = {
  draft: "bg-background text-muted",
  sent: "bg-accent-wash text-accent",
  paid: "bg-good-badge/10 text-good",
  void: "bg-background text-muted line-through",
};

function total(inv: Invoice): number {
  return invoiceTotals(inv.items, inv.tax_rate, inv.discount).total;
}

export default async function InvoicesPage() {
  const [invoices, { plan, trialEndsAt }] = await Promise.all([getInvoices(), getPlanContext()]);
  const revenueAllowed = planAllows(plan, "revenue_analytics", trialEndsAt);
  const csvAllowed = planAllows(plan, "invoice_csv", trialEndsAt);
  const vatAllowed = planAllows(plan, "vat_summary", trialEndsAt);
  const currency = invoices[0]?.currency ?? "EUR";
  const realInvoices = invoices.filter((i) => i.doc_type !== "quote");

  const outstanding = realInvoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + total(i), 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  const paidThisMonth = realInvoices
    .filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart)
    .reduce((sum, i) => sum + total(i), 0);
  const overdue = realInvoices.filter(
    (i) =>
      i.status === "sent" && i.due_date && new Date(i.due_date + "T23:59:59") < new Date()
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-ink-2">
            Make an invoice in under a minute — print it, send it, get paid.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <InvoicesToolbar invoices={invoices} allowed={csvAllowed} />
          <Link
            href="/dashboard/invoices/new"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-strong"
          >
            + New invoice
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Outstanding" value={formatMoney(outstanding, currency)} />
        <StatTile label="Paid this month" value={formatMoney(paidThisMonth, currency)} />
        <StatTile label="Overdue" value={String(overdue)} upIsGood={false} />
        <StatTile label="Total invoices" value={String(realInvoices.length)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <RevenueChart invoices={invoices} allowed={revenueAllowed} />
        {(() => {
          if (!vatAllowed) {
            return (
              <div className="rounded-2xl border border-dashed border-hairline bg-surface p-5">
                <h3 className="text-sm font-semibold text-ink">Tax quarter</h3>
                <p className="mt-2 text-sm text-ink-2">
                  🔒 Revenue and VAT collected this quarter — your tax return in one glance. A{" "}
                  <strong>Pro</strong> feature.
                </p>
                <Link
                  href="/dashboard/settings#billing"
                  className="mt-2 inline-block text-sm font-semibold text-accent hover:underline"
                >
                  Upgrade to unlock →
                </Link>
              </div>
            );
          }
          const now = new Date();
          const q = Math.floor(now.getMonth() / 3);
          const qStart = new Date(now.getFullYear(), q * 3, 1);
          let ex = 0;
          let vat = 0;
          for (const inv of realInvoices) {
            if (inv.status !== "paid" || !inv.paid_at || new Date(inv.paid_at) < qStart) continue;
            const t = invoiceTotals(inv.items, inv.tax_rate, inv.discount);
            ex += t.subtotal - t.discount;
            vat += t.tax;
          }
          return (
            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <h3 className="text-sm font-semibold text-ink">
                Tax quarter · Q{q + 1} {now.getFullYear()} (paid)
              </h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-2">Revenue (ex. VAT)</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(ex, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-2">VAT collected</dt>
                  <dd className="font-semibold tabular-nums">{formatMoney(vat, currency)}</dd>
                </div>
                <div className="flex justify-between border-t border-hairline pt-2.5">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="font-bold tabular-nums">{formatMoney(ex + vat, currency)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                Set aside the VAT — future you says thanks.
              </p>
            </div>
          );
        })()}
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface p-12 text-center">
          <p className="font-display text-xl font-bold">No invoices yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
            Create your first one — client, a couple of line items, done. Kept handles the
            numbering and the math.
          </p>
          <Link
            href="/dashboard/invoices/new"
            className="mt-6 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <table className="w-full text-sm" style={{ minWidth: "44rem" }}>
            <thead>
              <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-5 py-3.5">Number</th>
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Issued</th>
                <th className="px-5 py-3.5">Due</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="group border-b border-hairline transition-colors last:border-0 hover:bg-raised">
                  <td className="px-5 py-4 font-mono text-xs font-semibold">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="flex items-center gap-2 text-accent group-hover:underline">
                      {inv.number}
                      {inv.doc_type === "quote" && (
                        <span className="rounded-full bg-marker px-1.5 py-0.5 font-sans text-[10px] font-bold text-marker-ink">
                          QUOTE
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="block">
                      {inv.client_name || "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink-2">{formatDate(inv.issue_date)}</td>
                  <td className="px-5 py-4 text-ink-2">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums">
                    {formatMoney(total(inv), inv.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[inv.status]}`}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                      {inv.doc_type !== "quote" &&
                        inv.status === "sent" &&
                        inv.due_date &&
                        new Date(inv.due_date + "T23:59:59") < new Date() &&
                        inv.client_email && (
                          <a
                            href={`mailto:${inv.client_email}?subject=${encodeURIComponent(
                              `Friendly reminder: invoice ${inv.number}`
                            )}&body=${encodeURIComponent(
                              `Hi ${inv.client_name || "there"},\n\nJust a friendly reminder that invoice ${inv.number} (${formatMoney(total(inv), inv.currency)}) was due on ${formatDate(inv.due_date)}. Could you take care of it when you get a chance?\n\nThanks!`
                            )}`}
                            className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger/20"
                            title="Open a prefilled payment reminder email"
                          >
                            Chase ↗
                          </a>
                        )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
