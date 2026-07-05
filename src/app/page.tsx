import Link from "next/link";
import { Logo } from "@/components/logo";

const TRADES = [
  "plumbers", "cleaners", "photographers", "electricians", "gardeners",
  "tutors", "painters", "dog groomers", "caterers", "movers", "barbers",
  "mechanics", "roofers", "personal trainers",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-medium text-ink-2 sm:flex">
            <a href="#how" className="hover:text-ink transition-colors">How it works</a>
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
            <Link href="/invoice-generator" className="hover:text-ink transition-colors">
              Free invoice tool
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative">
          <div className="dot-grid absolute inset-0 -z-10" />
          <div className="mx-auto max-w-6xl px-5 pb-24 pt-16 sm:pt-24">
            <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-2" style={{ "--d": "0s" } as React.CSSProperties}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good-badge" />
                  For people who run the business AND do the work
                </p>
                <h1
                  className="fade-up font-display text-[2.9rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.3rem]"
                  style={{ "--d": "0.08s" } as React.CSSProperties}
                >
                  You&apos;re on a job.
                  <br />
                  A lead just messaged.
                  <br />
                  <span className="marker">Kept already pinged you.</span>
                </h1>
                <p
                  className="fade-up mt-7 max-w-lg text-lg leading-relaxed text-ink-2"
                  style={{ "--d": "0.16s" } as React.CSSProperties}
                >
                  An instant alert for every enquiry, reminders at 24&nbsp;hours, 48&nbsp;hours
                  and 3&nbsp;days until you&apos;ve replied, and invoices done in a minute.
                  No CRM manual. No sales-team ceremony.
                </p>
                <div
                  className="fade-up mt-9 flex flex-wrap items-center gap-4"
                  style={{ "--d": "0.24s" } as React.CSSProperties}
                >
                  <Link
                    href="/signup"
                    className="rounded-xl bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-transform hover:-translate-y-0.5"
                  >
                    Start free — no card
                  </Link>
                  <Link
                    href="/dashboard"
                    className="group text-base font-semibold text-ink"
                  >
                    Poke around the live demo{" "}
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
                <p
                  className="fade-up mt-5 text-sm text-muted"
                  style={{ "--d": "0.3s" } as React.CSSProperties}
                >
                  Alerts, reminders &amp; invoices today · auto-replies to customers next
                </p>
              </div>

              {/* Hero mock: floating conversation stack */}
              <div className="relative mx-auto w-full max-w-md">
                <div
                  className="float-soft rounded-2xl border border-hairline bg-raised p-4 shadow-xl"
                  style={{ "--r": "-1.2deg", "--d": "0s" } as React.CSSProperties}
                >
                  <div className="flex items-center gap-2.5 border-b border-hairline pb-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-good-badge/15 text-base">💬</span>
                    <div>
                      <p className="text-sm font-semibold text-ink">Tom V. · WhatsApp</p>
                      <p className="text-[11px] text-muted">new lead · 14:32</p>
                    </div>
                    <span className="ml-auto rounded-full bg-accent-wash px-2 py-0.5 text-[11px] font-semibold text-accent">new</span>
                  </div>
                  <p className="mt-3 rounded-xl rounded-tl-sm bg-background px-3.5 py-2.5 text-sm text-ink">
                    Saw your work on Instagram. Do you do full kitchen renovations?
                  </p>
                  <p className="ml-8 mt-2 rounded-xl rounded-tr-sm bg-accent-wash px-3.5 py-2.5 text-sm text-ink">
                    📣 <span className="font-semibold">Kept → you:</span> New lead! Tom wants a
                    kitchen reno. Reply now to win the job.
                  </p>
                  <p className="ml-8 mt-1.5 text-right text-[11px] text-muted">
                    alert sent to your inbox · 14:32 <span className="text-accent">✓✓</span>
                  </p>
                </div>

                <div
                  className="float-soft absolute -right-4 -top-8 rounded-xl border border-hairline bg-raised px-4 py-3 shadow-lg sm:-right-10"
                  style={{ "--r": "2deg", "--d": "0.8s" } as React.CSSProperties}
                >
                  <p className="text-xs font-semibold text-ink">⚡ You knew in 3 seconds</p>
                  <p className="text-[11px] text-muted">even while tiling a bathroom</p>
                </div>

                <div
                  className="float-soft absolute -bottom-10 -left-4 rounded-xl border border-hairline bg-raised px-4 py-3 shadow-lg sm:-left-10"
                  style={{ "--r": "-2deg", "--d": "1.6s" } as React.CSSProperties}
                >
                  <p className="text-xs font-semibold text-ink">⏰ Reminders queued</p>
                  <p className="text-[11px] text-muted">in 24 h · then 48 h · then 3 days</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trades marquee ────────────────────────────────── */}
        <section className="border-y border-hairline bg-surface py-4" aria-hidden>
          <div className="relative overflow-hidden">
            <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
              {[...TRADES, ...TRADES].map((t, i) => (
                <span key={i} className="font-display text-lg font-semibold text-muted">
                  {t} <span className="ml-8 text-hairline">·</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pain: chat bubbles ────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-24">
          <p className="text-center font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            the problem
          </p>
          <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Sound familiar?
          </h2>
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
            {[
              { q: "I lose half my leads because I forget to reply.", r: "-0.6deg" },
              { q: "I reply too late and they already hired someone else.", r: "0.7deg" },
              { q: "CRMs are too complicated. I don't have a sales team — I AM the sales team.", r: "0.5deg" },
              { q: "I just want something simple that reminds me and follows up.", r: "-0.8deg" },
            ].map(({ q, r }) => (
              <figure
                key={q}
                className="rounded-2xl rounded-tl-sm border border-hairline bg-surface p-6 shadow-sm transition-transform hover:rotate-0 hover:scale-[1.02]"
                style={{ transform: `rotate(${r})` }}
              >
                <blockquote className="font-display text-xl font-semibold leading-snug text-ink">
                  “{q}”
                </blockquote>
                <figcaption className="mt-3 text-sm text-muted">
                  — every small-business forum, every week
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-14 text-center text-xl font-medium text-ink">
            Kept is the <span className="marker font-semibold">simple follow-up tool</span> they keep asking for.
          </p>
        </section>

        {/* ── Big numbers strip ─────────────────────────────── */}
        <section className="bg-ink-panel text-ink-panel-text">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-3">
            {[
              ["3 sec", "from enquiry to an alert in your pocket — any hour, any day"],
              ["3×", "reminders until you've replied or closed the lead"],
              ["0", "leads forgotten in an unread inbox. Ever."],
            ].map(([n, d]) => (
              <div key={n} className="text-center sm:text-left">
                <p className="font-display text-5xl font-bold tracking-tight sm:text-6xl">{n}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-70">{d}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-6xl px-5 pb-10 text-center text-xs opacity-50 sm:text-left">
            Firms that respond to a lead within an hour are ~7× more likely to qualify it than those
            that wait even sixty minutes. (Harvard Business Review)
          </p>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-24">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            how it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Three things. Done <span className="marker">automatically</span>.
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Capture every lead",
                body: "Your website form and WhatsApp feed one inbox. Nothing rots in spam or an unread chat.",
              },
              {
                n: "02",
                title: "Get pinged, then chased",
                body: "An instant alert with their message and number, then reminders at 24 h, 48 h and 3 days — until you reply or close it.",
              },
              {
                n: "03",
                title: "Close it and get paid",
                body: "New → Contacted → Won → Lost. Then turn the won job into a clean invoice in under a minute.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="group rounded-2xl border border-hairline bg-surface p-7 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="font-display text-4xl font-bold text-hairline transition-colors group-hover:text-accent">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2.5 leading-relaxed text-ink-2">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <section id="features" className="border-y border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              features
            </p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["⚡", "Instant new-lead alerts", "The second someone enquires, their message and number land in your inbox — on a ladder, in traffic, or asleep."],
                ["🔁", "Relentless reminders", "24 h / 48 h / 3 d by default. Kept keeps nudging you until every lead is replied to or closed — never lets you forget."],
                ["🧾", "Invoices in a minute", "Client, a few line items, done. Auto-numbered, VAT handled, discounts, paid-tracking, print-ready PDFs."],
                ["📨", "Send as your own email", "Connect Gmail once and Kept sends from your real address — send-only, it never reads your inbox."],
                ["📋", "Four-column pipeline", "New → Contacted → Won → Lost. That's the whole methodology. Learn it in nine seconds."],
                ["💬", "One-click reply & call", "Open a prefilled reply from your templates or dial the lead — Kept marks them contacted for you."],
                ["📑", "Quotes that become invoices", "Send a quote, win the job, hit convert — it's an invoice. No retyping, ever."],
                ["🌐", "No website? No problem", "Kept hosts a mini-site for you — your services + a contact form at your own link. Or paste one snippet into any site you already have."],
                ["📅", "Appointments & calendar", "Book a date on any lead, see your week at a glance, one click adds it to Google or Apple Calendar."],
                ["📊", "Insights & revenue analytics", "Lead trend, win rate by source, monthly revenue from paid invoices, and a Monday digest email."],
              ].map(([icon, title, body]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-hairline bg-raised p-6 transition-all hover:-translate-y-1 hover:border-accent/50 hover:shadow-md"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-wash text-lg">
                    {icon}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-ink-2">
              Auto-replies and follow-ups <em>to your customers</em> (email, WhatsApp, SMS) are
              coming soon — in this version Kept only ever messages <strong>you</strong>. Try the{" "}
              <Link href="/invoice-generator" className="font-semibold text-accent hover:underline">
                free invoice generator
              </Link>{" "}
              right now, no account needed.
            </p>
          </div>
        </section>

        {/* ── Not-a-CRM ─────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                versus the heavyweights
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
                It&apos;s not a CRM.
                <br />
                <span className="marker">That&apos;s the point.</span>
              </h2>
              <p className="mt-6 leading-relaxed text-ink-2">
                HubSpot, Zoho and Pipedrive are brilliant — for sales teams with managers,
                quotas and onboarding weeks. You mow lawns, fix boilers, shoot weddings.
                You need leads answered and followed up. That&apos;s all Kept does,
                and it does it relentlessly.
              </p>
              <ul className="mt-7 space-y-3.5 text-ink">
                {[
                  "Set up in 10 minutes, not 10 meetings",
                  "Zero required fields, zero “deal stages” to configure",
                  "One screen you'll actually open every day",
                ].map((li) => (
                  <li key={li} className="flex items-start gap-3 font-medium">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-good-badge/15 text-xs text-good">✓</span>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface shadow-sm">
              <table className="w-full text-sm" style={{ minWidth: "26rem" }}>
                <thead>
                  <tr className="border-b border-hairline text-left">
                    <th className="p-4"></th>
                    <th className="p-4 font-display text-base font-bold text-accent">kept</th>
                    <th className="p-4 font-medium text-muted">Typical CRM</th>
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  {[
                    ["Time to first follow-up", "Instant", "After you build workflows"],
                    ["Setup", "~10 minutes", "Days to weeks"],
                    ["Made for", "One busy owner", "Sales teams"],
                    ["Monthly cost", "From €9", "€50–€800+"],
                  ].map(([label, kept, crm]) => (
                    <tr key={label} className="border-b border-hairline last:border-0">
                      <td className="p-4 font-medium text-ink">{label}</td>
                      <td className="p-4 font-semibold text-ink">{kept}</td>
                      <td className="p-4">{crm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────── */}
        <section id="pricing" className="border-t border-hairline bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <p className="text-center font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              pricing
            </p>
            <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Honest pricing for one-person businesses
            </h2>
            <p className="mx-auto mt-4 max-w-md text-center text-ink-2">
              Every plan includes <strong>unlimited leads, unlimited invoices</strong> and the
              full reminder engine. No per-seat pricing — there&apos;s one of you.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Solo",
                  price: "€9",
                  blurb: "The essentials, forever simple.",
                  features: [
                    "Hosted lead page + website form capture",
                    "Instant alerts, reminders + snooze",
                    "One-click reply & call buttons",
                    "Appointments with calendar export",
                    "Unlimited invoices, PDFs & duplicates",
                    "Pipeline, win rate & 14-day trend",
                  ],
                  featured: false,
                },
                {
                  name: "Standard",
                  price: "€29",
                  blurb: "Run it exactly your way.",
                  features: [
                    "Everything in Solo",
                    "Quotes — convert to invoice when won",
                    "Custom reminder sequence & reply templates",
                    "Customisable lead page (tagline & services)",
                    "Private lead notes, lead & invoice CSV",
                    "Lead source insights & win rates",
                  ],
                  featured: true,
                },
                {
                  name: "Pro",
                  price: "€49",
                  blurb: "Send as you. Know your numbers.",
                  features: [
                    "Everything in Standard",
                    "Send as your own email (Gmail)",
                    "Overdue invoice alerts + one-click chase",
                    "Revenue analytics & quarterly VAT summary",
                    "Monday weekly digest email",
                    "Priority support + first access to auto-replies, WhatsApp & SMS",
                  ],
                  featured: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={
                    "relative flex flex-col rounded-3xl p-8 transition-transform hover:-translate-y-1 " +
                    (plan.featured
                      ? "bg-ink-panel text-ink-panel-text shadow-2xl"
                      : "border border-hairline bg-raised")
                  }
                >
                  {plan.featured && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-marker px-4 py-1 text-xs font-bold text-marker-ink">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                  <p className={"mt-1 text-sm " + (plan.featured ? "opacity-60" : "text-muted")}>
                    {plan.blurb}
                  </p>
                  <p className="mt-6">
                    <span className="font-display text-5xl font-bold tracking-tight">{plan.price}</span>
                    <span className={"text-sm " + (plan.featured ? "opacity-60" : "text-muted")}> /month</span>
                  </p>
                  <ul className={"mt-7 flex-1 space-y-3 text-sm " + (plan.featured ? "opacity-85" : "text-ink-2")}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className={plan.featured ? "text-marker" : "text-good"}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={
                      "mt-8 rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors " +
                      (plan.featured
                        ? "bg-marker text-marker-ink hover:opacity-90"
                        : "border border-hairline text-ink hover:border-accent hover:text-accent")
                    }
                  >
                    Start free trial
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-muted">
              3-day free trial on every plan · cancel anytime · no card to start
            </p>
          </div>
        </section>

        {/* ── Final CTA (ink panel) ─────────────────────────── */}
        <section className="bg-ink-panel text-ink-panel-text">
          <div className="mx-auto max-w-6xl px-5 py-28 text-center">
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              The next lead that messages you will{" "}
              <span className="marker">never slip through</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-md text-lg opacity-70">
              Even if you&apos;re elbow-deep in a job. That&apos;s the whole product.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-marker px-8 py-4 text-base font-bold text-marker-ink transition-transform hover:-translate-y-0.5"
              >
                Start free — no card
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-white/20 px-8 py-4 text-base font-semibold transition-colors hover:border-white/50"
              >
                Explore the demo
              </Link>
            </div>
          </div>

          {/* Footer inside the ink panel */}
          <footer className="border-t border-white/10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-10 sm:flex-row">
              <Logo light />
              <p className="text-sm opacity-50">
                © {new Date().getFullYear()} Kept · Never lose a lead again.
              </p>
              <div className="flex gap-6 text-sm opacity-70">
                <a href="#pricing" className="hover:opacity-100">Pricing</a>
                <Link href="/invoice-generator" className="hover:opacity-100">Free invoice tool</Link>
                <Link href="/login" className="hover:opacity-100">Log in</Link>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
