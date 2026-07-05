"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveLeadNotes } from "@/app/dashboard/actions";

export function LeadNotes({
  leadId,
  initialNotes,
  allowed = true,
}: {
  leadId: string;
  initialNotes: string;
  allowed?: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState<null | "ok" | "demo" | string>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await saveLeadNotes(leadId, notes);
      if (!res.ok) setSaved(res.error ?? "Failed to save");
      else setSaved(res.demo ? "demo" : "ok");
    });
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-surface p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Your notes</h3>
        <p className="mt-2 text-sm text-ink-2">
          🔒 Private lead notes are a <strong>Standard</strong> feature.
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

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Your notes</h3>
      <textarea
        className="mt-3 min-h-24 w-full resize-y rounded-lg border border-hairline bg-raised px-3.5 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted focus:border-accent"
        placeholder="Quote given, address, gut feeling — anything you'd forget by Friday."
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(null);
        }}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save notes"}
        </button>
        {saved === "ok" && <span className="text-xs font-medium text-good">Saved ✓</span>}
        {saved === "demo" && <span className="text-xs text-muted">Demo mode — not stored.</span>}
        {saved && saved !== "ok" && saved !== "demo" && (
          <span className="text-xs text-danger">{saved}</span>
        )}
      </div>
    </div>
  );
}
