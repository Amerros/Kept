import type { Metadata } from "next";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { LeadsToolbar } from "@/components/dashboard/leads-toolbar";
import { PipelineBoard } from "@/components/dashboard/pipeline-board";
import { SourceInsights } from "@/components/dashboard/source-insights";
import { StatTile } from "@/components/dashboard/stat-tile";
import Link from "next/link";
import { Onboarding } from "@/components/dashboard/onboarding";
import { getInvoices, getLeads, getLeadsPerDay, getPlanContext, getSettings } from "@/lib/data";
import { formatDateTime, nowMs } from "@/lib/format";
import { planAllows } from "@/lib/plan";

export const metadata: Metadata = { title: "Leads" };

export default async function DashboardPage() {
  const [leads, perDay, { plan, trialEndsAt }, invoices, settings] = await Promise.all([
    getLeads(),
    getLeadsPerDay(),
    getPlanContext(),
    getInvoices(),
    getSettings(),
  ]);
  const csvAllowed = planAllows(plan, "csv_export", trialEndsAt);
  const insightsAllowed = planAllows(plan, "source_insights", trialEndsAt);

  const weekMs = 7 * 86_400_000;
  const now = nowMs();
  const thisWeek = leads.filter((l) => now - new Date(l.created_at).getTime() < weekMs);
  const lastWeek = leads.filter((l) => {
    const age = now - new Date(l.created_at).getTime();
    return age >= weekMs && age < 2 * weekMs;
  });

  const needsReply = leads.filter((l) => l.status === "new").length;
  const won = leads.filter((l) => l.status === "won").length;
  const lost = leads.filter((l) => l.status === "lost").length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-ink-2">
            {needsReply > 0
              ? `${needsReply} ${needsReply === 1 ? "lead is" : "leads are"} waiting for your reply — Kept has already sent the instant response.`
              : "All caught up. Kept is watching for new enquiries."}
          </p>
        </div>
        <LeadsToolbar leads={leads} csvAllowed={csvAllowed} />
      </div>

      <Onboarding
        leadsCount={leads.length}
        invoicesCount={invoices.length}
        intakeKey={settings.intake_key}
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="New leads this week"
          value={String(thisWeek.length)}
          delta={thisWeek.length - lastWeek.length}
          deltaPeriod="last week"
        />
        <StatTile label="Waiting on you" value={String(needsReply)} upIsGood={false} />
        <StatTile label="Won" value={String(won)} />
        <StatTile label="Win rate" value={`${winRate}%`} />
      </div>

      {/* This week's appointments */}
      {(() => {
        const upcoming = leads
          .filter(
            (l) =>
              l.appointment_at &&
              new Date(l.appointment_at).getTime() > now - 3600_000 &&
              new Date(l.appointment_at).getTime() < now + weekMs
          )
          .sort((a, b) => a.appointment_at!.localeCompare(b.appointment_at!));
        if (upcoming.length === 0) return null;
        return (
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <h3 className="text-sm font-semibold text-ink">📅 Booked this week</h3>
            <ul className="mt-3 flex flex-wrap gap-2.5">
              {upcoming.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/dashboard/leads/${l.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-raised px-3.5 py-2 text-sm transition-colors hover:border-accent"
                  >
                    <span className="font-semibold text-ink">{l.name}</span>
                    <span className="text-xs text-muted">{formatDateTime(l.appointment_at!)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Trend + sources */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <LeadsChart data={perDay} />
        <SourceInsights leads={leads} allowed={insightsAllowed} />
      </div>

      {/* Pipeline */}
      <PipelineBoard initialLeads={leads} />
    </div>
  );
}
