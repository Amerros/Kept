import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadActions } from "@/components/dashboard/lead-actions";
import { LeadAppointment } from "@/components/dashboard/lead-appointment";
import { LeadNotes } from "@/components/dashboard/lead-notes";
import {
  getFollowUpsForLead,
  getLead,
  getMessagesForLead,
  getPlanContext,
  getSettings,
} from "@/lib/data";
import { planAllows } from "@/lib/plan";
import { formatDateTime, timeAgo, timeUntil } from "@/lib/format";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "Lead" };

const STATUS_BADGE: Record<string, string> = {
  new: "bg-accent-wash text-accent",
  contacted: "bg-warning/15 text-ink-2",
  won: "bg-good-badge/10 text-good",
  lost: "bg-background text-muted",
};

const CHANNEL_ICON: Record<string, string> = {
  email: "✉️",
  whatsapp: "💬",
  sms: "📱",
  reminder: "🔔",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const [messages, followUps, { plan, trialEndsAt }, settings] = await Promise.all([
    getMessagesForLead(id),
    getFollowUpsForLead(id),
    getPlanContext(),
    getSettings(),
  ]);
  const notesAllowed = planAllows(plan, "lead_notes", trialEndsAt);
  const customTemplatesAllowed = planAllows(plan, "custom_templates", trialEndsAt);

  const pending = followUps.filter((f) => f.status === "pending");
  const past = followUps.filter((f) => f.status !== "pending");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
      >
        ← All leads
      </Link>

      {/* Contact card */}
      <div className="rounded-2xl border border-hairline bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{lead.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-2">
              {lead.email && <span>✉️ {lead.email}</span>}
              {lead.phone && <span>📞 {lead.phone}</span>}
              <span className="text-muted">
                via {SOURCE_LABELS[lead.source]} · {timeAgo(lead.created_at)}
              </span>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE[lead.status]}`}
          >
            {STATUS_LABELS[lead.status]}
          </span>
        </div>
        {lead.message && (
          <blockquote className="mt-5 rounded-xl border border-hairline bg-raised p-4 text-[15px] leading-relaxed text-ink">
            “{lead.message}”
          </blockquote>
        )}
      </div>

      <LeadActions
        lead={lead}
        templates={settings.reply_templates}
        businessName={settings.business_name}
        customTemplatesAllowed={customTemplatesAllowed}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Conversation timeline */}
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Conversation
          </h2>
          {messages.length === 0 ? (
            <p className="rounded-2xl border border-hairline bg-surface p-6 text-sm text-muted">
              No messages logged yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    "max-w-[85%] rounded-2xl border p-4 " +
                    (m.direction === "outbound"
                      ? "ml-auto border-accent/30 bg-accent-wash"
                      : "border-hairline bg-surface")
                  }
                >
                  <p className="text-sm leading-relaxed text-ink">{m.body}</p>
                  <p className="mt-2 text-[11px] text-muted">
                    {m.direction === "outbound"
                      ? m.channel === "reminder"
                        ? "Kept → you"
                        : "Kept → lead"
                      : "Lead"}{" "}
                    ·{" "}
                    {CHANNEL_ICON[m.channel]} {m.channel} · {formatDateTime(m.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Follow-up queue */}
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Automation
          </h2>
          <div className="mb-6 space-y-4">
            <LeadAppointment lead={lead} businessName={settings.business_name} />
            <LeadNotes leadId={lead.id} initialNotes={lead.notes ?? ""} allowed={notesAllowed} />
          </div>
          <div className="space-y-3">
            {pending.length === 0 && past.length === 0 && (
              <p className="rounded-2xl border border-hairline bg-surface p-5 text-sm text-muted">
                No follow-ups scheduled.
              </p>
            )}
            {pending.map((f) => (
              <div key={f.id} className="rounded-2xl border border-hairline bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {f.kind === "reminder" ? "🔔 Reminder to you" : `${CHANNEL_ICON[f.channel]} Follow-up`}
                  </span>
                  <span className="rounded-full bg-accent-wash px-2 py-0.5 text-[11px] font-medium text-accent">
                    {timeUntil(f.run_at)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-ink-2">
                  {f.template.replace(/\{\{name\}\}/g, lead.name.split(" ")[0])}
                </p>
              </div>
            ))}
            {past.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-hairline bg-surface p-4 opacity-70"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-2">
                    {CHANNEL_ICON[f.channel]} {f.kind === "reminder" ? "Reminder" : "Follow-up"}
                  </span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[11px] font-medium " +
                      (f.status === "sent"
                        ? "bg-good-badge/10 text-good"
                        : "bg-background text-muted")
                    }
                  >
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
            {pending.length > 0 && (
              <p className="px-1 text-xs text-muted">
                Follow-ups stop automatically when the lead replies or you close them.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
