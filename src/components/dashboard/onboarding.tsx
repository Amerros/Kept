"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

/**
 * First-visit onboarding: a short welcome tour (modal, 5 steps) plus a
 * "getting started" checklist that tracks real progress and disappears
 * once the user is rolling. State lives in localStorage — no schema, and
 * dismissing is per-device, which is fine for a five-second tour.
 */

const TOUR_KEY = "kept-tour-done";
const CHECKLIST_KEY = "kept-checklist-dismissed";
const SHARED_KEY = "kept-lead-page-shared";

const noopSubscribe = () => () => {};
function useLocalFlag(key: string): [boolean | null, () => void] {
  // null while server-rendering so nothing flashes before hydration.
  const stored = useSyncExternalStore(
    noopSubscribe,
    () => localStorage.getItem(key),
    () => "ssr"
  );
  const [overridden, setOverridden] = useState(false);
  if (stored === "ssr") return [null, () => {}];
  const set = () => {
    localStorage.setItem(key, "1");
    setOverridden(true);
  };
  return [overridden || stored === "1", set];
}

const STEPS = [
  {
    icon: "👋",
    title: "Welcome to Kept",
    body: "This is your pipeline. Every enquiry lands here as a lead and moves through four columns: New → Contacted → Won → Lost. That's the whole method — no deal stages to configure, ever.",
  },
  {
    icon: "🌐",
    title: "Get leads flowing in",
    body: "You already have a personal lead page — a mini-site with your services and a contact form. Share its link on WhatsApp, Instagram, or your van. Got a website? Settings has a form snippet to paste in. Every submission becomes a lead here automatically.",
  },
  {
    icon: "🔔",
    title: "Kept never lets you forget",
    body: "The moment a lead arrives, you get an email with their message and number. If you don't act, Kept reminds you at 24 h, 48 h and 3 days — until you mark the lead contacted, won or lost. It only ever emails you, never your customers.",
  },
  {
    icon: "🧾",
    title: "Quotes & invoices in a minute",
    body: "Win the job? Head to Invoices: auto-numbered, VAT handled, print-ready PDFs. Send a quote first and convert it to an invoice with one click when they accept. Kept flags overdue invoices and writes the chase email for you.",
  },
  {
    icon: "🚀",
    title: "You're on the full-access trial",
    body: "For 3 days you have everything — custom sequences, analytics, the lot. Poke around, add a lead by hand to see the flow, and pick a plan in Settings → Billing when you're ready. Questions? Every email Kept sends you can be replied to.",
  },
];

function Tour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-hairline bg-raised p-8 shadow-2xl">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-wash text-3xl">
          {s.icon}
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">{s.title}</h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{s.body}</p>

        <div className="mt-6 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === step ? "w-6 bg-accent" : "w-1.5 bg-hairline")
              }
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => (last ? onDone() : setStep(step + 1))}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            {last ? "Let's go" : "Next"}
          </button>
          {step > 0 && !last && (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink-2 hover:text-ink"
            >
              Back
            </button>
          )}
          {!last && (
            <button
              onClick={onDone}
              className="ml-auto text-sm font-medium text-muted hover:text-ink"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Onboarding({
  leadsCount,
  invoicesCount,
  intakeKey,
}: {
  leadsCount: number;
  invoicesCount: number;
  intakeKey: string;
}) {
  const [tourDone, markTourDone] = useLocalFlag(TOUR_KEY);
  const [checklistDismissed, dismissChecklist] = useLocalFlag(CHECKLIST_KEY);
  const [shared, markShared] = useLocalFlag(SHARED_KEY);
  const [replaying, setReplaying] = useState(false);

  // Wait for hydration before deciding anything.
  if (tourDone === null || checklistDismissed === null || shared === null) return null;

  const showTour = !tourDone || replaying;

  const items = [
    {
      done: Boolean(shared),
      label: "Put your lead page out there",
      hint: "Open it, then share the link on WhatsApp or Instagram.",
      action: (
        <a
          href={`/p/${intakeKey}`}
          target="_blank"
          rel="noreferrer"
          onClick={markShared}
          className="font-semibold text-accent hover:underline"
        >
          Open your page ↗
        </a>
      ),
    },
    {
      done: leadsCount > 0,
      label: "Get your first lead in",
      hint: "Wait for a real one, or use “+ Add lead” above to try the flow.",
      action: null,
    },
    {
      done: invoicesCount > 0,
      label: "Make your first invoice",
      hint: "Takes about a minute — numbering and VAT are done for you.",
      action: (
        <Link href="/dashboard/invoices/new" className="font-semibold text-accent hover:underline">
          Create one →
        </Link>
      ),
    },
  ];
  const allDone = items.every((i) => i.done);
  const showChecklist = !checklistDismissed && !allDone;

  return (
    <>
      {showTour && (
        <Tour
          onDone={() => {
            markTourDone();
            setReplaying(false);
          }}
        />
      )}

      {showChecklist && (
        <div className="rounded-2xl border border-accent/30 bg-accent-wash/60 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-ink">Getting started</h3>
              <p className="mt-0.5 text-xs text-ink-2">
                Three steps and Kept is fully working for you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReplaying(true)}
                className="text-xs font-medium text-ink-2 hover:text-ink"
              >
                Replay tour
              </button>
              <button
                onClick={dismissChecklist}
                aria-label="Dismiss checklist"
                className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:bg-background hover:text-ink"
              >
                ✕
              </button>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5">
            {items.map((item) => (
              <li key={item.label} className="flex items-start gap-3 text-sm">
                <span
                  className={
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold " +
                    (item.done
                      ? "bg-good-badge text-white"
                      : "border-2 border-hairline bg-raised text-transparent")
                  }
                >
                  ✓
                </span>
                <span className={item.done ? "text-muted line-through" : "text-ink"}>
                  <span className="font-medium">{item.label}</span>
                  {!item.done && (
                    <span className="ml-2 text-xs text-ink-2">
                      {item.hint} {item.action}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
