"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { saveSettings } from "@/app/dashboard/settings/actions";
import { formatDelay, nowMs } from "@/lib/format";
import { planAllows } from "@/lib/plan";
import type { BusinessSettings, Channel, FollowupStep, Plan } from "@/lib/types";

const PLAN_LABELS: Record<Plan, string> = {
  trial: "Free trial",
  solo: "Solo — €9/mo",
  standard: "Standard — €29/mo",
  pro: "Pro — €49/mo",
};

const inputCls =
  "w-full rounded-lg border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent";

function ComingSoon() {
  return (
    <span className="rounded-full bg-marker px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-marker-ink">
      coming soon
    </span>
  );
}

function PlanBadge({ tier }: { tier: "Standard" | "Pro" }) {
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      {tier}
    </span>
  );
}

function Section({
  title,
  blurb,
  badge,
  children,
}: {
  title: string;
  blurb: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-ink">
        {title}
        {badge}
      </h2>
      <p className="mt-1 text-sm text-ink-2">{blurb}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
        (checked ? "bg-accent" : "bg-hairline")
      }
    >
      <span
        className={
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
          (checked ? "translate-x-5.5" : "translate-x-0.5")
        }
      />
    </button>
  );
}

function intakeSnippet(origin: string, intakeKey: string): string {
  return `<!-- Kept lead form — paste anywhere on your website -->
<form action="${origin}/api/intake" method="POST" style="display:grid;gap:10px;max-width:420px">
  <input type="hidden" name="intake_key" value="${intakeKey}">
  <input type="hidden" name="redirect" value="https://YOUR-SITE.com/thanks">
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
  <input name="name" placeholder="Your name" required>
  <input name="email" type="email" placeholder="Email">
  <input name="phone" type="tel" placeholder="Phone">
  <textarea name="message" placeholder="How can we help?" rows="4"></textarea>
  <button type="submit">Send</button>
</form>`;
}

export function SettingsForm({
  initialSettings,
  initialSteps,
  paymentLinks = { solo: "", standard: "", pro: "" },
}: {
  initialSettings: BusinessSettings;
  initialSteps: FollowupStep[];
  paymentLinks?: { solo: string; standard: string; pro: string };
}) {
  const [s, setS] = useState(initialSettings);
  const [steps, setSteps] = useState(initialSteps);
  const [saved, setSaved] = useState<null | "ok" | "demo" | string>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const nowClient = nowMs();

  const canEditSequence = planAllows(s.plan, "custom_sequence", s.trial_ends_at);
  const canEditTemplates = planAllows(s.plan, "custom_templates", s.trial_ends_at);
  const canPriceBook = planAllows(s.plan, "price_book", s.trial_ends_at);
  const canWebhook = planAllows(s.plan, "webhook", s.trial_ends_at);
  const canWeeklyDigest = planAllows(s.plan, "weekly_digest", s.trial_ends_at);

  const setTemplate = (i: number, value: string) => {
    setSaved(null);
    setS((prev) => ({
      ...prev,
      reply_templates: prev.reply_templates.map((t, j) => (j === i ? value : t)),
    }));
  };

  // Hydration-safe: server renders a placeholder, client swaps in the real origin.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "https://your-kept-domain.com"
  );

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setSaved(null);
    setS((prev) => ({ ...prev, [key]: value }));
  };

  const setStep = (id: string, patch: Partial<FollowupStep>) => {
    setSaved(null);
    setSteps((prev) => prev.map((st) => (st.id === id ? { ...st, ...patch } : st)));
  };

  function handleSave() {
    startTransition(async () => {
      const res = await saveSettings(s, steps);
      if (!res.ok) setSaved(res.error ?? "Failed to save");
      else setSaved(res.demo ? "demo" : "ok");
    });
  }

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(intakeSnippet(origin, s.intake_key));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — user can select the text manually */
    }
  }

  const snippet = intakeSnippet(origin, s.intake_key);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Section title="Business" blurb="How Kept identifies your business.">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Business name</span>
          <input
            className={inputCls}
            value={s.business_name}
            onChange={(e) => set("business_name", e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Email shown on invoices</span>
            <input
              className={inputCls}
              type="email"
              placeholder="hello@yourbusiness.com"
              value={s.from_email}
              onChange={(e) => set("from_email", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Address shown on invoices</span>
            <textarea
              className={inputCls + " min-h-10 resize-y"}
              rows={2}
              placeholder={"Hoofdstraat 21\n2611 AB Delft"}
              value={s.business_address}
              onChange={(e) => set("business_address", e.target.value)}
            />
          </label>
        </div>
      </Section>

      <Section
        title="New-lead alerts"
        blurb="The moment a lead comes in, Kept emails you with their message and contact details — so you can reply while the job is still hot."
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Email me about every new lead</span>
          <Toggle
            checked={s.new_lead_alert_enabled}
            onChange={(v) => set("new_lead_alert_enabled", v)}
            label="New lead alerts"
          />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Send alerts &amp; reminders to</span>
          <input
            className={inputCls}
            type="email"
            placeholder="you@yourbusiness.com"
            value={s.notify_email}
            onChange={(e) => set("notify_email", e.target.value)}
          />
        </label>
      </Section>

      <Section
        title="Your reminders"
        blurb="Kept nudges you when a lead has waited too long for a personal reply — then keeps nudging on the schedule below until you close them."
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">Remind me about unanswered leads</span>
          <Toggle
            checked={s.reminder_enabled}
            onChange={(v) => set("reminder_enabled", v)}
            label="Reminders"
          />
        </div>
        {s.reminder_enabled && (
          <label className="flex items-center gap-2 text-sm text-ink-2">
            First nudge after
            <select
              className="rounded-lg border border-hairline bg-raised px-2 py-1.5 text-sm outline-none focus:border-accent"
              value={s.reminder_delay_minutes}
              onChange={(e) => set("reminder_delay_minutes", Number(e.target.value))}
            >
              {[15, 30, 60, 120, 240].map((m) => (
                <option key={m} value={m}>
                  {formatDelay(m)}
                </option>
              ))}
            </select>
            of silence
          </label>
        )}
      </Section>

      <Section
        title="Reminder sequence"
        badge={canEditSequence ? undefined : <PlanBadge tier="Standard" />}
        blurb="If a lead stays unanswered, Kept keeps reminding you on this schedule — and stops the moment you reply or close them. Use {{name}} for the lead's name."
      >
        {!canEditSequence && (
          <div className="rounded-xl border border-dashed border-accent/40 bg-accent-wash p-3 text-sm text-ink-2">
            You&apos;re on the default sequence. Customising the timing and wording is a{" "}
            <strong>Standard</strong> feature —{" "}
            <a href="#billing" className="font-semibold text-accent hover:underline">
              upgrade to edit it
            </a>
            .
          </div>
        )}
        <div className={canEditSequence ? "space-y-4" : "pointer-events-none space-y-4 opacity-60"}>
        {steps
          .slice()
          .sort((a, b) => a.step_order - b.step_order)
          .map((step) => (
            <div
              key={step.id}
              className={
                "rounded-xl border border-hairline p-4 transition-opacity " +
                (step.enabled ? "" : "opacity-55")
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-accent-wash px-2.5 py-0.5 text-xs font-semibold text-accent">
                  Step {step.step_order}
                </span>
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  after
                  <select
                    className="rounded-lg border border-hairline bg-raised px-2 py-1.5 text-sm outline-none focus:border-accent"
                    value={step.delay_minutes}
                    onChange={(e) => setStep(step.id, { delay_minutes: Number(e.target.value) })}
                  >
                    {[30, 60, 180, 720, 1440, 2880, 4320, 10080].map((m) => (
                      <option key={m} value={m}>
                        {formatDelay(m)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  via
                  <select
                    className="rounded-lg border border-hairline bg-raised px-2 py-1.5 text-sm outline-none focus:border-accent"
                    value={step.channel}
                    onChange={(e) => setStep(step.id, { channel: e.target.value as Channel })}
                  >
                    <option value="reminder">Email to me</option>
                    <option value="email" disabled>
                      Email to lead (coming soon)
                    </option>
                    <option value="whatsapp" disabled>
                      WhatsApp to lead (coming soon)
                    </option>
                    <option value="sms" disabled>
                      SMS to lead (coming soon)
                    </option>
                  </select>
                </label>
                <div className="ml-auto">
                  <Toggle
                    checked={step.enabled}
                    onChange={(v) => setStep(step.id, { enabled: v })}
                    label={`Step ${step.step_order} enabled`}
                  />
                </div>
              </div>
              <textarea
                className={inputCls + " mt-3 min-h-20 resize-y leading-relaxed"}
                value={step.template}
                onChange={(e) => setStep(step.id, { template: e.target.value })}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Reply templates"
        badge={canEditTemplates ? undefined : <PlanBadge tier="Standard" />}
        blurb="One-click replies on every lead use these. Use {{name}} for the lead's first name — pick the right one and your email opens prefilled."
      >
        {!canEditTemplates && (
          <div className="rounded-xl border border-dashed border-accent/40 bg-accent-wash p-3 text-sm text-ink-2">
            You&apos;re using the default template. Writing your own is a <strong>Standard</strong>{" "}
            feature —{" "}
            <a href="#billing" className="font-semibold text-accent hover:underline">
              upgrade to customise
            </a>
            .
          </div>
        )}
        <div className={canEditTemplates ? "space-y-3" : "pointer-events-none space-y-3 opacity-60"}>
          {(s.reply_templates.length > 0 ? s.reply_templates : [""]).map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                className={inputCls + " min-h-16 resize-y leading-relaxed"}
                value={t}
                onChange={(e) => setTemplate(i, e.target.value)}
              />
              <button
                type="button"
                aria-label="Remove template"
                disabled={s.reply_templates.length <= 1}
                onClick={() => {
                  setSaved(null);
                  setS((prev) => ({
                    ...prev,
                    reply_templates: prev.reply_templates.filter((_, j) => j !== i),
                  }));
                }}
                className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
          {s.reply_templates.length < 5 && (
            <button
              type="button"
              onClick={() => {
                setSaved(null);
                setS((prev) => ({ ...prev, reply_templates: [...prev.reply_templates, ""] }));
              }}
              className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              + Add template
            </button>
          )}
        </div>
      </Section>

      <Section
        title="Weekly digest"
        badge={canWeeklyDigest ? undefined : <PlanBadge tier="Pro" />}
        blurb="Every Monday morning: new leads, jobs won and revenue collected — your whole week in one email."
      >
        <div className={"flex items-center justify-between gap-4" + (canWeeklyDigest ? "" : " opacity-60")}>
          <span className="text-sm font-medium">Send me a Monday summary</span>
          <Toggle
            checked={canWeeklyDigest ? s.weekly_digest_enabled : false}
            onChange={(v) => set("weekly_digest_enabled", v)}
            label="Weekly digest"
            disabled={!canWeeklyDigest}
          />
        </div>
        {!canWeeklyDigest && (
          <p className="text-sm text-ink-2">
            A <strong>Pro</strong> feature —{" "}
            <a href="#billing" className="font-semibold text-accent hover:underline">
              upgrade to turn it on
            </a>
            .
          </p>
        )}
      </Section>

      <Section
        title="Your lead page"
        blurb="A ready-made mini-site with your services and a contact form — perfect if you don't have a website. Share the link on WhatsApp, Instagram, or your van."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <code className="rounded-lg border border-hairline bg-raised px-3 py-2 font-mono text-xs text-ink">
            {origin}/p/{s.intake_key}
          </code>
          <a
            href={`/p/${s.intake_key}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Preview ↗
          </a>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium">Page live</span>
            <Toggle
              checked={s.page_enabled}
              onChange={(v) => set("page_enabled", v)}
              label="Lead page live"
            />
          </div>
        </div>
        <div className={planAllows(s.plan, "page_customize", s.trial_ends_at) ? "space-y-4" : "pointer-events-none space-y-4 opacity-60"}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Tagline</span>
            <input
              className={inputCls}
              placeholder="Plumbing, tiling & home repairs — fast quotes, tidy work."
              value={s.page_tagline}
              onChange={(e) => set("page_tagline", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Services (one per line)</span>
            <textarea
              className={inputCls + " min-h-20 resize-y"}
              placeholder={"Bathroom renovation\nLeak repair\nTiling & grouting"}
              value={s.page_services}
              onChange={(e) => set("page_services", e.target.value)}
            />
          </label>
        </div>
        {!planAllows(s.plan, "page_customize", s.trial_ends_at) && (
          <p className="text-sm text-ink-2">
            Your page shows your business name and form. Adding a tagline and services list is a{" "}
            <strong>Standard</strong> feature —{" "}
            <a href="#billing" className="font-semibold text-accent hover:underline">
              upgrade to customise
            </a>
            .
          </p>
        )}
      </Section>

      <Section
        title="Lead capture form"
        blurb="Paste this snippet on your website and every submission lands straight in your pipeline (and in your inbox). Style it however you like — only the field names matter."
      >
        <div className="relative">
          <pre className="max-h-64 overflow-auto rounded-xl border border-hairline bg-raised p-4 font-mono text-xs leading-relaxed text-ink-2">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={copySnippet}
            className="absolute right-3 top-3 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Your form key: <code className="font-mono">{s.intake_key}</code> — it can only create
          leads, never read your data.
        </p>
      </Section>

      <Section
        title="Calendar sync"
        blurb="Subscribe once and every appointment you book in Kept appears in your calendar automatically — Google, Apple or Outlook."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <code className="max-w-full overflow-x-auto rounded-lg border border-hairline bg-raised px-3 py-2 font-mono text-xs text-ink">
            {origin}/api/calendar/{s.calendar_key || "…"}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${origin}/api/calendar/${s.calendar_key}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* user can select manually */
              }
            }}
            className="rounded-lg border border-hairline px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted">
          Google Calendar: Other calendars → <strong>From URL</strong> → paste. Apple: File →
          New Calendar Subscription. Keep this link private — it shows appointment details.
        </p>
      </Section>

      <Section
        title="Integrations"
        badge={canWebhook ? undefined : <PlanBadge tier="Pro" />}
        blurb="Kept POSTs a JSON payload to this URL the moment a new lead arrives — plug in Zapier, Make, n8n or your own script and connect Kept to 5,000+ apps."
      >
        <label className={"block" + (canWebhook ? "" : " pointer-events-none opacity-60")}>
          <span className="mb-1.5 block text-sm font-medium">Webhook URL</span>
          <input
            className={inputCls}
            type="url"
            placeholder="https://hooks.zapier.com/hooks/catch/…"
            value={s.webhook_url}
            onChange={(e) => set("webhook_url", e.target.value)}
            disabled={!canWebhook}
          />
        </label>
        {canWebhook ? (
          <p className="text-xs text-muted">
            Payload: <code className="font-mono">{`{ event: "lead.created", business, lead: { name, email, phone, message, source } }`}</code>
          </p>
        ) : (
          <p className="text-sm text-ink-2">
            A <strong>Pro</strong> feature —{" "}
            <a href="#billing" className="font-semibold text-accent hover:underline">
              upgrade to connect your tools
            </a>
            .
          </p>
        )}
      </Section>

      <Section
        title="Price book"
        badge={canPriceBook ? undefined : <PlanBadge tier="Standard" />}
        blurb="Your usual services and prices — one click drops them into any invoice or quote, so you never retype “Call-out fee — €45” again."
      >
        <div className={canPriceBook ? "space-y-2.5" : "pointer-events-none space-y-2.5 opacity-60"}>
          {s.price_book.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem_1.75rem] items-center gap-2">
              <input
                className={inputCls}
                placeholder="Service (e.g. Call-out & diagnosis)"
                value={p.description}
                onChange={(e) => {
                  setSaved(null);
                  setS((prev) => ({
                    ...prev,
                    price_book: prev.price_book.map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x
                    ),
                  }));
                }}
              />
              <input
                className={inputCls + " text-right tabular-nums"}
                type="number"
                min={0}
                step="0.01"
                aria-label="Price"
                value={p.unit_price}
                onChange={(e) => {
                  setSaved(null);
                  setS((prev) => ({
                    ...prev,
                    price_book: prev.price_book.map((x, j) =>
                      j === i ? { ...x, unit_price: Number(e.target.value) } : x
                    ),
                  }));
                }}
              />
              <button
                type="button"
                aria-label="Remove price book item"
                onClick={() => {
                  setSaved(null);
                  setS((prev) => ({
                    ...prev,
                    price_book: prev.price_book.filter((_, j) => j !== i),
                  }));
                }}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
          {s.price_book.length < 30 && (
            <button
              type="button"
              onClick={() => {
                setSaved(null);
                setS((prev) => ({
                  ...prev,
                  price_book: [...prev.price_book, { description: "", unit_price: 0 }],
                }));
              }}
              className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              + Add service
            </button>
          )}
        </div>
        {!canPriceBook && (
          <p className="text-sm text-ink-2">
            A <strong>Standard</strong> feature —{" "}
            <a href="#billing" className="font-semibold text-accent hover:underline">
              upgrade to build your price book
            </a>
            .
          </p>
        )}
      </Section>

      <Section
        title="Invoices"
        blurb="Defaults for new invoices. You can override everything per invoice."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Number prefix</span>
            <input
              className={inputCls}
              value={s.invoice_prefix}
              onChange={(e) => set("invoice_prefix", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Currency</span>
            <select
              className={inputCls}
              value={s.invoice_currency}
              onChange={(e) => set("invoice_currency", e.target.value)}
            >
              {["EUR", "USD", "GBP", "CHF", "SEK", "DKK", "NOK", "PLN"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">VAT / tax rate %</span>
            <input
              className={inputCls}
              type="number"
              min={0}
              max={100}
              value={s.invoice_tax_rate}
              onChange={(e) => set("invoice_tax_rate", Number(e.target.value))}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Footer (payment details, terms…)</span>
          <textarea
            className={inputCls + " min-h-16 resize-y"}
            placeholder="Payment within 14 days to NL00 BANK 0123 4567 89."
            value={s.invoice_footer}
            onChange={(e) => set("invoice_footer", e.target.value)}
          />
        </label>
      </Section>

      <Section
        title="Customer auto-replies"
        badge={<ComingSoon />}
        blurb="Instant replies and follow-ups to the lead themselves. In this version Kept only contacts you; auto-replies launch as a premium add-on."
      >
        <div className="flex items-center justify-between gap-4 opacity-60">
          <span className="text-sm font-medium">Reply instantly to every new lead</span>
          <Toggle checked={false} onChange={() => {}} label="Instant reply" disabled />
        </div>
        <label className="block opacity-60">
          <span className="mb-1.5 block text-sm font-medium">WhatsApp business number</span>
          <input className={inputCls} placeholder="+31 6 …" value={s.whatsapp_from} disabled />
        </label>
      </Section>

      <Section
        title="Billing"
        blurb="Every plan includes unlimited leads, unlimited invoices and the full reminder engine."
      >
        <div id="billing" className="-mt-24 pt-24" aria-hidden />
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-accent-wash px-3 py-1 text-sm font-semibold text-accent">
            {PLAN_LABELS[s.plan]}
          </span>
          {s.plan === "trial" && s.trial_ends_at && (
            <span className="text-sm text-ink-2">
              {Math.max(0, Math.ceil((new Date(s.trial_ends_at).getTime() - nowClient) / 86_400_000))}{" "}
              days left — pick a plan below to keep everything running.
            </span>
          )}
        </div>
        {paymentLinks.solo || paymentLinks.standard || paymentLinks.pro ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["solo", "Solo", "€9/mo", paymentLinks.solo],
                ["standard", "Standard", "€29/mo", paymentLinks.standard],
                ["pro", "Pro", "€49/mo", paymentLinks.pro],
              ] as const
            ).map(([plan, name, price, link]) =>
              link ? (
                <a
                  key={plan}
                  href={`${link}?client_reference_id=${s.business_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    "rounded-xl border p-4 text-center transition-colors " +
                    (s.plan === plan
                      ? "border-accent bg-accent-wash"
                      : "border-hairline hover:border-accent")
                  }
                >
                  <p className="text-sm font-bold text-ink">{name}</p>
                  <p className="text-xs text-muted">{price}</p>
                  <p className="mt-1.5 text-xs font-semibold text-accent">
                    {s.plan === plan ? "Current plan" : "Upgrade →"}
                  </p>
                </a>
              ) : null
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-hairline p-4 text-sm text-muted">
            Payments aren&apos;t wired up yet. Create three Stripe Payment Links and set{" "}
            <code className="font-mono text-xs">STRIPE_PLINK_SOLO/STANDARD/PRO</code> +{" "}
            <code className="font-mono text-xs">STRIPE_WEBHOOK_SECRET</code> in{" "}
            <code className="font-mono text-xs">.env.local</code>.
          </p>
        )}
      </Section>

      <div className="sticky bottom-4 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={pending}
          className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-strong disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        {saved === "ok" && <span className="text-sm font-medium text-good">Saved ✓</span>}
        {saved === "demo" && (
          <span className="text-sm text-ink-2">
            Looks good! (Demo mode — changes aren&apos;t stored yet.)
          </span>
        )}
        {saved && saved !== "ok" && saved !== "demo" && (
          <span className="text-sm text-danger">{saved}</span>
        )}
      </div>
    </div>
  );
}
