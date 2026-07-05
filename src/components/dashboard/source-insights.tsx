import Link from "next/link";
import { SOURCE_LABELS, type Lead, type LeadSource } from "@/lib/types";

/**
 * Where leads come from and which sources actually convert (Standard+).
 * Horizontal proportion bars + won-rate per source; server-rendered.
 */
export function SourceInsights({ leads, allowed }: { leads: Lead[]; allowed: boolean }) {
  if (!allowed) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-surface p-5">
        <h3 className="text-sm font-semibold text-ink">Lead sources</h3>
        <p className="mt-2 text-sm text-ink-2">
          🔒 See which channels bring the most leads — and which ones actually turn into paid
          work. A <strong>Standard</strong> feature.
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

  const sources = Object.keys(SOURCE_LABELS) as LeadSource[];
  const rows = sources
    .map((source) => {
      const of = leads.filter((l) => l.source === source);
      const closed = of.filter((l) => l.status === "won" || l.status === "lost");
      const won = of.filter((l) => l.status === "won");
      return {
        source,
        count: of.length,
        winRate: closed.length > 0 ? Math.round((won.length / closed.length) * 100) : null,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">Lead sources · all time</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No leads yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.source} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate text-ink-2">{SOURCE_LABELS[r.source]}</span>
              <span className="flex items-center gap-2">
                <span
                  className="h-3.5 rounded-r-sm rounded-l-[1px] bg-accent"
                  style={{ width: `${Math.max((r.count / max) * 100, 4)}%` }}
                />
                <span className="font-semibold tabular-nums text-ink">{r.count}</span>
              </span>
              <span className="text-xs tabular-nums text-muted">
                {r.winRate === null ? "no outcomes yet" : `${r.winRate}% won`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
