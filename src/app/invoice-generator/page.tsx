import type { Metadata } from "next";
import Link from "next/link";
import { InvoiceEditor } from "@/components/invoice/invoice-editor";
import { Logo } from "@/components/logo";
import { isoDateWithOffset } from "@/lib/format";
import type { InvoiceDraft } from "@/lib/types";

export const metadata: Metadata = {
  title: "Free Invoice Generator — No Signup, No Watermark",
  description:
    "Make a professional invoice in under a minute, free. No account, no watermark, no catch — VAT and totals calculated for you. Print or save as PDF in your browser.",
  alternates: { canonical: "/invoice-generator" },
  openGraph: {
    title: "Free Invoice Generator — No Signup, No Watermark · Kept",
    description:
      "Make a professional invoice in under a minute, free. VAT handled, print-ready PDF, nothing leaves your browser.",
    url: "https://www.rkept.com/invoice-generator",
  },
};

export default function InvoiceGeneratorPage() {
  const today = isoDateWithOffset(0);
  const due = isoDateWithOffset(14);

  const initialDraft: InvoiceDraft = {
    doc_type: "invoice",
    number: "INV-0001",
    business_name: "",
    business_address: "",
    business_email: "",
    client_name: "",
    client_email: "",
    client_address: "",
    issue_date: today,
    due_date: due,
    currency: "EUR",
    tax_rate: 21,
    discount: 0,
    items: [{ description: "", qty: 1, unit_price: 0 }],
    notes: "",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="print-hidden sticky top-0 z-40 border-b border-hairline bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Logo />
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        <div className="print-hidden mx-auto mb-10 max-w-2xl text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            free tool · no account needed
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Make an invoice in <span className="marker">under a minute</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-ink-2">
            Fill in the form, watch your invoice build itself, then print it or save it as a
            PDF. No watermark, no signup, no catch — it never leaves your browser.
          </p>
        </div>

        <InvoiceEditor initialDraft={initialDraft} freeMode />

        <div className="print-hidden mx-auto mt-16 max-w-2xl rounded-3xl bg-ink-panel p-10 text-center text-ink-panel-text">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Tired of retyping your details every time?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-70">
            A free Kept account remembers your business, numbers your invoices automatically,
            tracks who&apos;s paid — and chases every lead that messages you so you never lose
            a job again.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-block rounded-xl bg-marker px-7 py-3.5 text-sm font-bold text-marker-ink transition-transform hover:-translate-y-0.5"
          >
            Create your free account
          </Link>
        </div>
      </main>
    </div>
  );
}
