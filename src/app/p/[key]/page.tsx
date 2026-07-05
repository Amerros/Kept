import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";

/**
 * Hosted lead page — a public mini-site for businesses without a website.
 * Share rkept.com/p/<key> on WhatsApp, Instagram, a van sticker… every
 * submission lands in the owner's pipeline with instant alerts + reminders.
 */

const inputCls =
  "w-full rounded-xl border border-hairline bg-raised px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-accent";

async function getPageData(key: string) {
  const supabase = getAdminSupabase();
  if (!supabase) return null;

  const { data: business } = await supabase
    .from("lf_businesses")
    .select("id,name,intake_key")
    .eq("intake_key", key)
    .maybeSingle();
  if (!business) return null;

  const { data: settings } = await supabase
    .from("lf_settings")
    .select("page_enabled,page_tagline,page_services,from_email,whatsapp_from")
    .eq("business_id", business.id)
    .maybeSingle();
  if (settings && !settings.page_enabled) return null;

  return { business, settings };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const data = await getPageData(key);
  return {
    title: data ? `${data.business.name} — get in touch` : "Get in touch",
    description: data?.settings?.page_tagline ?? "Send us a message and we'll get back to you fast.",
  };
}

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const [{ key }, { sent }] = await Promise.all([params, searchParams]);
  const data = await getPageData(key);
  if (!data) notFound();

  const { business, settings } = data;
  const services = ((settings?.page_services as string | null) ?? "")
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="dot-grid absolute inset-0 -z-10" />
      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-14 sm:py-20">
        <header className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent font-display text-2xl font-bold text-white">
            {business.name.trim().charAt(0).toUpperCase() || "K"}
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {business.name}
          </h1>
          {settings?.page_tagline && (
            <p className="mx-auto mt-3 max-w-md text-ink-2">{settings.page_tagline}</p>
          )}
        </header>

        {services.length > 0 && (
          <ul className="mx-auto mt-8 flex max-w-md flex-wrap justify-center gap-2">
            {services.map((s) => (
              <li
                key={s}
                className="rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-sm font-medium text-ink"
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        <section className="mt-10 rounded-3xl border border-hairline bg-surface p-6 shadow-sm sm:p-8">
          {sent ? (
            <div className="py-8 text-center">
              <p className="text-4xl">✅</p>
              <h2 className="mt-3 font-display text-2xl font-bold">Message sent!</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
                {business.name} has been notified and will get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-bold">Get a quote or ask a question</h2>
              <p className="mt-1 text-sm text-ink-2">
                Usually answered within the hour during working hours.
              </p>
              <form action="/api/intake" method="POST" className="mt-6 grid gap-3.5">
                <input type="hidden" name="intake_key" value={business.intake_key} />
                <input type="hidden" name="redirect" value={`/p/${business.intake_key}?sent=1`} />
                <input
                  type="text"
                  name="_gotcha"
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                />
                <input className={inputCls} name="name" placeholder="Your name" required />
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <input className={inputCls} name="email" type="email" placeholder="Email" />
                  <input className={inputCls} name="phone" type="tel" placeholder="Phone" />
                </div>
                <textarea
                  className={inputCls + " min-h-28 resize-y"}
                  name="message"
                  placeholder="What do you need done?"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/25 transition-transform hover:-translate-y-0.5"
                >
                  Send message
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <footer className="pb-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-ink transition-colors">
          ⚡ Powered by <span className="font-semibold">kept</span> — never lose a lead again
        </Link>
      </footer>
    </div>
  );
}
