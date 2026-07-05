"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceDocument } from "./invoice-document";
import type { InvoiceDraft } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-hairline bg-raised px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";
const smallLabel = "mb-1 block text-xs font-semibold uppercase tracking-wide text-muted";

export type SaveInvoiceResult =
  | { ok: true; id?: string; demo?: boolean }
  | { ok: false; error: string };

export function InvoiceEditor({
  initialDraft,
  saveAction,
  saveLabel = "Save invoice",
  freeMode = false,
  quotesAllowed = true,
}: {
  initialDraft: InvoiceDraft;
  /** Server action from the dashboard; omitted in the free public generator. */
  saveAction?: (draft: InvoiceDraft) => Promise<SaveInvoiceResult>;
  saveLabel?: string;
  freeMode?: boolean;
  quotesAllowed?: boolean;
}) {
  const router = useRouter();
  const [d, setD] = useState(initialDraft);
  const [saved, setSaved] = useState<null | "ok" | "demo" | string>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof InvoiceDraft>(key: K, value: InvoiceDraft[K]) => {
    setSaved(null);
    setD((prev) => ({ ...prev, [key]: value }));
  };

  const setItem = (index: number, patch: Partial<InvoiceDraft["items"][number]>) => {
    setSaved(null);
    setD((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  };

  const addItem = () =>
    set("items", [...d.items, { description: "", qty: 1, unit_price: 0 }]);
  const removeItem = (index: number) =>
    set("items", d.items.filter((_, i) => i !== index));

  function handleSave() {
    if (!saveAction) return;
    startTransition(async () => {
      const res = await saveAction(d);
      if (!res.ok) {
        setSaved(res.error);
        return;
      }
      setSaved(res.demo ? "demo" : "ok");
      if (res.id) router.push(`/dashboard/invoices/${res.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      {/* ── Form ─────────────────────────────────────────────── */}
      <div className="print-hidden space-y-4">
        <section className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              {d.doc_type === "quote" ? "Quote" : "Invoice"} details
            </h2>
            <div className="flex rounded-lg border border-hairline p-0.5 text-xs font-semibold">
              {(["invoice", "quote"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={t === "quote" && !quotesAllowed}
                  title={t === "quote" && !quotesAllowed ? "Quotes are a Standard feature" : undefined}
                  onClick={() => set("doc_type", t)}
                  className={
                    "rounded-md px-3 py-1.5 capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
                    (d.doc_type === t ? "bg-accent text-white" : "text-ink-2 hover:text-ink")
                  }
                >
                  {t}
                  {t === "quote" && !quotesAllowed && " 🔒"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 block sm:col-span-1">
              <span className={smallLabel}>Number</span>
              <input className={inputCls} value={d.number} onChange={(e) => set("number", e.target.value)} />
            </label>
            <label className="block">
              <span className={smallLabel}>Currency</span>
              <select className={inputCls} value={d.currency} onChange={(e) => set("currency", e.target.value)}>
                {["EUR", "USD", "GBP", "CHF", "SEK", "DKK", "NOK", "PLN"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={smallLabel}>Issued</span>
              <input className={inputCls} type="date" value={d.issue_date} onChange={(e) => set("issue_date", e.target.value)} />
            </label>
            <label className="block">
              <span className={smallLabel}>Due</span>
              <input className={inputCls} type="date" value={d.due_date} onChange={(e) => set("due_date", e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Your business</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={smallLabel}>Name</span>
              <input className={inputCls} placeholder="Van Dijk Home Services" value={d.business_name} onChange={(e) => set("business_name", e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={smallLabel}>Email</span>
                <input className={inputCls} type="email" value={d.business_email} onChange={(e) => set("business_email", e.target.value)} />
              </label>
              <label className="block">
                <span className={smallLabel}>Address</span>
                <textarea className={inputCls + " resize-y"} rows={2} value={d.business_address} onChange={(e) => set("business_address", e.target.value)} />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Bill to</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={smallLabel}>Client name</span>
              <input className={inputCls} placeholder="Jane de Vries" value={d.client_name} onChange={(e) => set("client_name", e.target.value)} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={smallLabel}>Email</span>
                <input className={inputCls} type="email" value={d.client_email} onChange={(e) => set("client_email", e.target.value)} />
              </label>
              <label className="block">
                <span className={smallLabel}>Address</span>
                <textarea className={inputCls + " resize-y"} rows={2} value={d.client_address} onChange={(e) => set("client_address", e.target.value)} />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Line items</h2>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-hairline px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              + Add item
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {d.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_3.5rem_5.5rem_1.75rem] items-center gap-2">
                <input
                  className={inputCls}
                  placeholder="What you did"
                  value={it.description}
                  onChange={(e) => setItem(i, { description: e.target.value })}
                />
                <input
                  className={inputCls + " text-right tabular-nums"}
                  type="number"
                  min={0}
                  step="any"
                  aria-label="Quantity"
                  value={it.qty}
                  onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                />
                <input
                  className={inputCls + " text-right tabular-nums"}
                  type="number"
                  min={0}
                  step="0.01"
                  aria-label="Unit price"
                  value={it.unit_price}
                  onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })}
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={d.items.length === 1}
                  aria-label="Remove item"
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className={smallLabel}>VAT / tax %</span>
              <input className={inputCls + " text-right tabular-nums"} type="number" min={0} max={100} value={d.tax_rate} onChange={(e) => set("tax_rate", Number(e.target.value))} />
            </label>
            <label className="block">
              <span className={smallLabel}>Discount (flat)</span>
              <input className={inputCls + " text-right tabular-nums"} type="number" min={0} step="0.01" value={d.discount} onChange={(e) => set("discount", Number(e.target.value))} />
            </label>
          </div>
          <label className="mt-3 block">
            <span className={smallLabel}>Notes / payment details</span>
            <textarea
              className={inputCls + " min-h-16 resize-y"}
              placeholder="Payment within 14 days to NL00 BANK 0123 4567 89."
              value={d.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </label>
        </section>

        {/* Actions */}
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-hairline bg-raised/95 p-3 shadow-lg backdrop-blur">
          {saveAction && (
            <button
              onClick={handleSave}
              disabled={pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              {pending ? "Saving…" : saveLabel}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-hairline px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Print / save as PDF
          </button>
          {saved === "ok" && <span className="text-sm font-medium text-good">Saved ✓</span>}
          {saved === "demo" && (
            <span className="text-sm text-ink-2">Demo mode — not stored.</span>
          )}
          {saved && saved !== "ok" && saved !== "demo" && (
            <span className="text-sm text-danger">{saved}</span>
          )}
          {freeMode && (
            <p className="text-xs text-muted">
              Want numbering, saved clients &amp; paid-tracking?{" "}
              <Link href="/signup" className="font-semibold text-accent hover:underline">
                Create a free account →
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ── Live preview (also what gets printed) ────────────── */}
      <div className="xl:sticky xl:top-20">
        <p className="print-hidden mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Live preview
        </p>
        <InvoiceDocument draft={d} />
      </div>
    </div>
  );
}
