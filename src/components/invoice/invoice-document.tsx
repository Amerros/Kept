import { formatDate, formatMoney } from "@/lib/format";
import { invoiceTotals, type InvoiceDraft } from "@/lib/types";

/**
 * The invoice itself — a clean, print-ready A4-ish document.
 * Pure render (no hooks) so it works in the dashboard, the free public
 * generator, and inside the browser's print dialog (see .invoice-sheet CSS).
 */
export function InvoiceDocument({ draft }: { draft: InvoiceDraft }) {
  const { subtotal, discount, tax, total } = invoiceTotals(
    draft.items,
    draft.tax_rate,
    draft.discount
  );
  const items = draft.items.filter((it) => it.description.trim() !== "" || it.unit_price !== 0);

  return (
    <div className="invoice-sheet rounded-2xl border border-hairline bg-white p-8 text-[#1a1a1a] shadow-sm sm:p-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">
            {draft.business_name || "Your Business"}
          </p>
          {draft.business_address && (
            <p className="mt-1 whitespace-pre-line text-sm text-[#666]">{draft.business_address}</p>
          )}
          {draft.business_email && <p className="mt-1 text-sm text-[#666]">{draft.business_email}</p>}
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold uppercase tracking-widest text-[#c9c9c9]">
            {draft.doc_type === "quote" ? "Quote" : "Invoice"}
          </p>
          <p className="mt-1 font-mono text-sm font-semibold">{draft.number || "INV-0001"}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-8 flex flex-wrap justify-between gap-6 border-t border-[#eee] pt-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#999]">Billed to</p>
          <p className="mt-1.5 text-sm font-semibold">{draft.client_name || "Client name"}</p>
          {draft.client_address && (
            <p className="mt-0.5 whitespace-pre-line text-sm text-[#666]">{draft.client_address}</p>
          )}
          {draft.client_email && <p className="mt-0.5 text-sm text-[#666]">{draft.client_email}</p>}
        </div>
        <div className="flex gap-10 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#999]">Issued</p>
            <p className="mt-1.5">{formatDate(draft.issue_date)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#999]">
              {draft.doc_type === "quote" ? "Valid until" : "Due"}
            </p>
            <p className="mt-1.5">{formatDate(draft.due_date)}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#1a1a1a] text-left text-[11px] font-semibold uppercase tracking-wider text-[#999]">
            <th className="pb-2">Description</th>
            <th className="pb-2 text-right">Qty</th>
            <th className="pb-2 text-right">Unit price</th>
            <th className="pb-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(items.length > 0 ? items : [{ description: "—", qty: 0, unit_price: 0 }]).map(
            (it, i) => (
              <tr key={i} className="border-b border-[#eee]">
                <td className="py-3 pr-4">{it.description || "—"}</td>
                <td className="py-3 text-right tabular-nums">{it.qty}</td>
                <td className="py-3 text-right tabular-nums">
                  {formatMoney(Number(it.unit_price) || 0, draft.currency)}
                </td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {formatMoney((Number(it.qty) || 0) * (Number(it.unit_price) || 0), draft.currency)}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="mt-6 ml-auto w-full max-w-60 space-y-2 text-sm">
        <div className="flex justify-between text-[#666]">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatMoney(subtotal, draft.currency)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[#666]">
            <span>Discount</span>
            <span className="tabular-nums">−{formatMoney(discount, draft.currency)}</span>
          </div>
        )}
        {draft.tax_rate > 0 && (
          <div className="flex justify-between text-[#666]">
            <span>VAT ({draft.tax_rate}%)</span>
            <span className="tabular-nums">{formatMoney(tax, draft.currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-[#1a1a1a] pt-2 text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(total, draft.currency)}</span>
        </div>
      </div>

      {/* Notes / footer */}
      {draft.notes && (
        <p className="mt-10 whitespace-pre-line border-t border-[#eee] pt-5 text-sm text-[#666]">
          {draft.notes}
        </p>
      )}
    </div>
  );
}
