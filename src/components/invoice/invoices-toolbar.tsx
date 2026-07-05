"use client";

import Link from "next/link";
import { invoiceTotals, type Invoice } from "@/lib/types";

function exportCsv(invoices: Invoice[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [
    ["Number", "Type", "Status", "Client", "Issued", "Due", "Currency", "Subtotal", "Discount", "Tax", "Total", "Paid at"],
    ...invoices.map((i) => {
      const t = invoiceTotals(i.items, i.tax_rate, i.discount);
      return [
        i.number, i.doc_type, i.status, i.client_name, i.issue_date, i.due_date ?? "",
        i.currency, t.subtotal.toFixed(2), t.discount.toFixed(2), t.tax.toFixed(2),
        t.total.toFixed(2), i.paid_at ?? "",
      ];
    }),
  ];
  const csv = rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `kept-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** "Hand your accountant a CSV" — Standard+. */
export function InvoicesToolbar({ invoices, allowed }: { invoices: Invoice[]; allowed: boolean }) {
  if (!allowed) {
    return (
      <Link
        href="/dashboard/settings#billing"
        title="Invoice CSV export is a Standard feature"
        className="rounded-xl border border-dashed border-hairline px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
      >
        🔒 Export CSV
      </Link>
    );
  }
  return (
    <button
      onClick={() => exportCsv(invoices)}
      className="rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
    >
      Export CSV
    </button>
  );
}
