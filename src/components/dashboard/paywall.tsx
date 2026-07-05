import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/dashboard/logout-button";

/**
 * Hard paywall — shown instead of the entire dashboard once the free trial
 * has expired without a paid plan. Leads keep flowing in and reminders keep
 * being scheduled in the background; picking a plan unlocks everything again.
 */
export function Paywall({
  businessId,
  paymentLinks,
}: {
  businessId: string | null;
  paymentLinks: { solo: string; standard: string; pro: string };
}) {
  const ref = businessId ? `?client_reference_id=${businessId}` : "";
  const plans = [
    {
      name: "Solo",
      price: "€9",
      link: paymentLinks.solo,
      blurb: "Alerts, reminders, pipeline, unlimited invoices.",
      featured: false,
    },
    {
      name: "Standard",
      price: "€29",
      link: paymentLinks.standard,
      blurb: "+ custom sequences, quotes, notes, CSV, insights.",
      featured: true,
    },
    {
      name: "Pro",
      price: "€49",
      link: paymentLinks.pro,
      blurb: "+ revenue analytics, VAT summary, weekly digest, overdue alerts.",
      featured: false,
    },
  ];
  const anyLink = plans.some((p) => p.link);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <Logo />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <span className="rounded-full bg-marker px-3 py-1 text-xs font-bold uppercase tracking-wide text-marker-ink">
          trial ended
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Your leads are still coming in.
          <br />
          Pick a plan to keep working them.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-2">
          Nothing has been deleted — your pipeline, invoices and settings are all safe, and new
          enquiries keep landing. Choose a plan and you&apos;re back in seconds.
        </p>

        {anyLink ? (
          <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
            {plans.map((p) =>
              p.link ? (
                <a
                  key={p.name}
                  href={`${p.link}${ref}`}
                  className={
                    "flex flex-col rounded-2xl p-6 text-left transition-transform hover:-translate-y-1 " +
                    (p.featured
                      ? "bg-ink-panel text-ink-panel-text shadow-xl"
                      : "border border-hairline bg-surface")
                  }
                >
                  <span className="font-display text-lg font-bold">{p.name}</span>
                  <span className="mt-1 font-display text-3xl font-bold">
                    {p.price}
                    <span className={"text-sm font-normal " + (p.featured ? "opacity-60" : "text-muted")}>
                      /mo
                    </span>
                  </span>
                  <span className={"mt-2 text-xs leading-relaxed " + (p.featured ? "opacity-75" : "text-ink-2")}>
                    {p.blurb}
                  </span>
                  <span
                    className={
                      "mt-4 rounded-lg px-3 py-2 text-center text-xs font-bold " +
                      (p.featured ? "bg-marker text-marker-ink" : "bg-accent text-white")
                    }
                  >
                    Unlock with {p.name} →
                  </span>
                </a>
              ) : null
            )}
          </div>
        ) : (
          <p className="mt-10 rounded-xl border border-dashed border-hairline p-5 text-sm text-muted">
            Payments aren&apos;t configured yet (missing STRIPE_PLINK_* env vars).
          </p>
        )}

        <p className="mt-8 text-xs text-muted">
          Payment is handled by Stripe · cancel anytime · your data is never deleted
        </p>
      </main>
    </div>
  );
}
