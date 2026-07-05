"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { snoozeLead, updateLeadStatus } from "@/app/dashboard/actions";
import type { Lead } from "@/lib/types";

const DEFAULT_TEMPLATE =
  "Hi {{name}}, thanks for reaching out! I'd be happy to help — when is a good moment to call you today?";

function fill(template: string, lead: Lead) {
  return template.replace(/\{\{name\}\}/g, (lead.name || "there").split(" ")[0]);
}

/**
 * One-click actions on a lead: reply by email (prefilled from your templates,
 * marks the lead contacted), call, and snooze. Custom templates are Standard+;
 * Solo gets the default one.
 */
export function LeadActions({
  lead,
  templates,
  businessName,
  customTemplatesAllowed,
}: {
  lead: Lead;
  templates: string[];
  businessName: string;
  customTemplatesAllowed: boolean;
}) {
  const router = useRouter();
  const [snoozed, setSnoozed] = useState(false);
  const [, startTransition] = useTransition();

  const usable = customTemplatesAllowed && templates.length > 0 ? templates : [DEFAULT_TEMPLATE];
  const [templateIdx, setTemplateIdx] = useState(0);
  const template = usable[Math.min(templateIdx, usable.length - 1)];

  function markContacted() {
    // Fire-and-forget alongside the mailto/tel the browser is opening.
    startTransition(async () => {
      await updateLeadStatus(lead.id, "contacted");
      router.refresh();
    });
  }

  function handleSnooze(minutes: number) {
    startTransition(async () => {
      const res = await snoozeLead(lead.id, minutes);
      if (res.ok) {
        setSnoozed(true);
        setTimeout(() => setSnoozed(false), 2500);
        router.refresh();
      }
    });
  }

  const mailto =
    lead.email &&
    `mailto:${lead.email}?subject=${encodeURIComponent(`Re: your enquiry — ${businessName}`)}&body=${encodeURIComponent(fill(template, lead))}`;

  const btn =
    "rounded-xl border border-hairline px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent";

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {mailto && (
          <a href={mailto} onClick={markContacted} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong">
            ✉️ Reply by email
          </a>
        )}
        {lead.phone && (
          <a href={`tel:${lead.phone.replace(/\s/g, "")}`} onClick={markContacted} className={btn}>
            📞 Call {lead.phone}
          </a>
        )}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          snooze:
          {(
            [
              ["4 h", 240],
              ["tomorrow", 1440],
              ["3 days", 4320],
            ] as const
          ).map(([label, mins]) => (
            <button
              key={label}
              onClick={() => handleSnooze(mins)}
              className="rounded-lg border border-hairline px-2.5 py-1.5 font-semibold text-ink-2 transition-colors hover:border-accent hover:text-accent"
            >
              {label}
            </button>
          ))}
          {snoozed && <span className="font-semibold text-good">reminder set ✓</span>}
        </span>
      </div>

      {mailto && usable.length > 1 && (
        <label className="mt-3 flex items-center gap-2 text-xs text-muted">
          template:
          <select
            className="rounded-lg border border-hairline bg-raised px-2 py-1 text-xs outline-none focus:border-accent"
            value={templateIdx}
            onChange={(e) => setTemplateIdx(Number(e.target.value))}
          >
            {usable.map((t, i) => (
              <option key={i} value={i}>
                {t.slice(0, 60)}…
              </option>
            ))}
          </select>
        </label>
      )}
      {mailto && !customTemplatesAllowed && (
        <p className="mt-2 text-xs text-muted">
          Using the default reply template — custom templates are a{" "}
          <Link href="/dashboard/settings#billing" className="font-semibold text-accent hover:underline">
            Standard feature
          </Link>
          .
        </p>
      )}
    </div>
  );
}
