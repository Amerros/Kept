"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAppointment } from "@/app/dashboard/actions";
import { formatDateTime } from "@/lib/format";
import type { Lead } from "@/lib/types";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Download a one-event .ics — opens in Google/Apple/Outlook calendar. */
function downloadIcs(lead: Lead, businessName: string) {
  if (!lead.appointment_at) return;
  const start = new Date(lead.appointment_at);
  const end = new Date(start.getTime() + 60 * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kept//EN",
    "BEGIN:VEVENT",
    `UID:kept-${lead.id}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${(lead.name || "Lead")} — ${businessName}`,
    `DESCRIPTION:${(lead.message || "").replace(/\r?\n/g, "\\n").slice(0, 400)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(lead.name || "appointment").replace(/\W+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadAppointment({ lead, businessName }: { lead: Lead; businessName: string }) {
  const router = useRouter();
  const [value, setValue] = useState(lead.appointment_at ? toLocalInput(lead.appointment_at) : "");
  const [editing, setEditing] = useState(!lead.appointment_at);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(iso: string | null) {
    startTransition(async () => {
      const res = await setAppointment(lead.id, iso);
      if (!res.ok) setError(res.error);
      else {
        setError(null);
        setEditing(iso === null);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Appointment</h3>
      {lead.appointment_at && !editing ? (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-accent-wash px-3 py-1.5 text-sm font-semibold text-accent">
            📅 {formatDateTime(lead.appointment_at)}
          </span>
          <button
            onClick={() => downloadIcs(lead, businessName)}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Add to calendar (.ics)
          </button>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:text-ink"
          >
            Change
          </button>
          <button
            onClick={() => save(null)}
            disabled={pending}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:text-danger disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <input
            type="datetime-local"
            className="rounded-lg border border-hairline bg-raised px-3 py-2 text-sm outline-none focus:border-accent"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            onClick={() => value && save(new Date(value).toISOString())}
            disabled={pending || !value}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            {pending ? "Saving…" : "Book it"}
          </button>
          {lead.appointment_at && (
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:text-ink"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
