"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLead } from "@/app/dashboard/actions";
import type { Lead } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent";

function exportCsv(leads: Lead[]) {
  const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["Name", "Email", "Phone", "Source", "Status", "Message", "Created", "Last contacted"],
    ...leads.map((l) => [
      l.name,
      l.email ?? "",
      l.phone ?? "",
      l.source,
      l.status,
      l.message ?? "",
      l.created_at,
      l.last_contacted_at ?? "",
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `kept-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsToolbar({
  leads,
  csvAllowed = true,
}: {
  leads: Lead[];
  csvAllowed?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [demoNote, setDemoNote] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addLead({ ...form, source: "manual" });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.demo) {
        setDemoNote(true);
        setTimeout(() => setDemoNote(false), 3000);
      }
      setForm({ name: "", email: "", phone: "", message: "" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="relative flex items-center gap-2.5">
      {csvAllowed ? (
        <button
          onClick={() => exportCsv(leads)}
          className="rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Export CSV
        </button>
      ) : (
        <a
          href="/dashboard/settings#billing"
          title="CSV export is a Standard feature"
          className="rounded-xl border border-dashed border-hairline px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
        >
          🔒 Export CSV
        </a>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-strong"
      >
        + Add lead
      </button>
      {demoNote && (
        <span className="absolute right-0 top-full mt-2 whitespace-nowrap text-xs text-muted">
          Demo mode — not stored.
        </span>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <form
            onSubmit={handleAdd}
            className="absolute right-0 top-full z-50 mt-2 w-80 space-y-3 rounded-2xl border border-hairline bg-raised p-5 shadow-xl"
          >
            <p className="text-sm font-semibold text-ink">Add a lead by hand</p>
            <p className="text-xs text-muted">Phone call, walk-in, referral — get it in the pipeline.</p>
            <input
              className={inputCls}
              placeholder="Name *"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className={inputCls}
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              className={inputCls}
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <textarea
              className={inputCls + " min-h-16 resize-y"}
              placeholder="What do they need?"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2.5">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
              >
                {pending ? "Adding…" : "Add lead"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-hairline px-4 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
