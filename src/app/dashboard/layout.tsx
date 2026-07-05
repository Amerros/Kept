import Link from "next/link";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Paywall } from "@/components/dashboard/paywall";
import { getPlanContext, isDemoMode } from "@/lib/data";
import { isLockedOut } from "@/lib/plan";

const NAV = [
  { href: "/dashboard", label: "Leads" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Hard paywall: expired trial → the whole dashboard is replaced by the
  // upgrade screen. Demo mode and paid plans pass straight through.
  if (!isDemoMode) {
    const { plan, trialEndsAt, businessId } = await getPlanContext();
    if (isLockedOut(plan, trialEndsAt)) {
      return (
        <Paywall
          businessId={businessId}
          paymentLinks={{
            solo: process.env.STRIPE_PLINK_SOLO ?? "",
            standard: process.env.STRIPE_PLINK_STANDARD ?? "",
            pro: process.env.STRIPE_PLINK_PRO ?? "",
          }}
        />
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {isDemoMode && (
        <div className="border-b border-hairline bg-accent-wash px-5 py-2 text-center text-[13px] text-ink-2">
          <span className="font-semibold text-accent">Demo mode</span> — you&apos;re browsing
          sample data. Connect Supabase keys in <code className="font-mono text-xs">.env.local</code> to go live.
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-8">
            <Logo href="/dashboard" />
            <nav className="flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink"
            >
              ← Site
            </Link>
            {!isDemoMode && <LogoutButton />}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
