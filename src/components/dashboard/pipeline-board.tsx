"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateLeadStatus } from "@/app/dashboard/actions";
import { timeAgo } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/types";

const COLUMNS: LeadStatus[] = ["new", "contacted", "won", "lost"];

/** Where a lead can move to from each status — keeps the controls tiny. */
const MOVES: Record<LeadStatus, LeadStatus[]> = {
  new: ["contacted", "won", "lost"],
  contacted: ["won", "lost", "new"],
  won: ["contacted"],
  lost: ["contacted"],
};

const COLUMN_ACCENT: Record<LeadStatus, string> = {
  new: "bg-accent",
  contacted: "bg-warning",
  won: "bg-good-badge",
  lost: "bg-muted",
};

export function PipelineBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [, startTransition] = useTransition();

  function move(leadId: string, status: LeadStatus) {
    // Optimistic: update locally, then persist (no-op in demo mode).
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              status,
              last_contacted_at:
                status === "contacted" ? new Date().toISOString() : l.last_contacted_at,
            }
          : l
      )
    );
    startTransition(async () => {
      await updateLeadStatus(leadId, status);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col);
        return (
          <section
            key={col}
            className="flex min-h-52 flex-col rounded-2xl border border-hairline bg-surface"
          >
            <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
              <span className={`h-2 w-2 rounded-full ${COLUMN_ACCENT[col]}`} />
              <h3 className="text-sm font-semibold text-ink">{STATUS_LABELS[col]}</h3>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-ink-2">
                {colLeads.length}
              </span>
            </header>

            <ul className="flex flex-1 flex-col gap-2.5 p-3">
              {colLeads.length === 0 && (
                <li className="grid flex-1 place-items-center py-6 text-sm text-muted">
                  Nothing here
                </li>
              )}
              {colLeads.map((lead) => (
                <li
                  key={lead.id}
                  className="group rounded-xl border border-hairline bg-raised p-3.5 transition-colors hover:border-accent/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-sm font-semibold text-ink group-hover:text-accent">
                        {lead.name}
                      </p>
                      {lead.message && (
                        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-2">
                          {lead.message}
                        </p>
                      )}
                    </Link>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-muted">
                    <span
                      className={
                        "rounded-full px-1.5 py-0.5 font-medium " +
                        (lead.source === "whatsapp"
                          ? "bg-good-badge/10 text-good"
                          : "bg-accent-wash text-accent")
                      }
                    >
                      {SOURCE_LABELS[lead.source]}
                    </span>
                    <span>{timeAgo(lead.created_at)}</span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {MOVES[col].map((to) => (
                      <button
                        key={to}
                        onClick={() => move(lead.id, to)}
                        className={
                          "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors " +
                          (to === "won"
                            ? "border-hairline text-good hover:border-good-badge"
                            : to === "lost"
                            ? "border-hairline text-ink-2 hover:border-danger hover:text-danger"
                            : "border-hairline text-ink-2 hover:border-accent hover:text-accent")
                        }
                      >
                        {to === "won" ? "Mark won" : to === "lost" ? "Mark lost" : `→ ${STATUS_LABELS[to]}`}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
