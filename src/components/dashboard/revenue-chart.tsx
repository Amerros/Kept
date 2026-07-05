import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { invoiceTotals, type Invoice } from "@/lib/types";

/**
 * Paid revenue per month, last 6 months (Pro). Server-rendered bars with the
 * amount labeled on the data end — no interaction needed at 6 points.
 */
export function RevenueChart({ invoices, allowed }: { invoices: Invoice[]; allowed: boolean }) {
  if (!allowed) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-surface p-5">
        <h3 className="text-sm font-semibold text-ink">Revenue · last 6 months</h3>
        <p className="mt-2 text-sm text-ink-2">
          🔒 Track paid revenue month by month, straight from your invoices. A{" "}
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

  const currency = invoices[0]?.currency ?? "EUR";
  const months: { key: string; label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
      total: 0,
    });
  }
  for (const inv of invoices) {
    if (inv.doc_type === "quote" || inv.status !== "paid" || !inv.paid_at) continue;
    const key = inv.paid_at.slice(0, 7);
    const m = months.find((x) => x.key === key);
    if (m) m.total += invoiceTotals(inv.items, inv.tax_rate, inv.discount).total;
  }

  const max = Math.max(...months.map((m) => m.total), 1);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">Revenue · last 6 months (paid invoices)</h3>
      <div className="mt-4 grid grid-cols-6 items-end gap-3" style={{ minHeight: "9rem" }}>
        {months.map((m) => (
          <div key={m.key} className="flex h-36 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-semibold tabular-nums text-ink">
              {m.total > 0 ? formatMoney(m.total, currency) : ""}
            </span>
            <div
              className="w-full max-w-10 rounded-t-[4px] bg-accent"
              style={{ height: `${Math.max((m.total / max) * 100, m.total > 0 ? 6 : 2)}%`, opacity: m.total > 0 ? 1 : 0.15 }}
            />
            <span className="text-[11px] text-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
