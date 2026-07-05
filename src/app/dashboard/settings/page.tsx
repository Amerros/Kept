import type { Metadata } from "next";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { getFollowupSteps, getSettings } from "@/lib/data";
import { isGoogleConfigured } from "@/lib/google";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, steps] = await Promise.all([getSettings(), getFollowupSteps()]);

  const paymentLinks = {
    solo: process.env.STRIPE_PLINK_SOLO ?? "",
    standard: process.env.STRIPE_PLINK_STANDARD ?? "",
    pro: process.env.STRIPE_PLINK_PRO ?? "",
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-ink-2">
          Your whole automation, on one page. Change it any time.
        </p>
      </div>
      <SettingsForm
        initialSettings={settings}
        initialSteps={steps}
        googleReady={isGoogleConfigured}
        paymentLinks={paymentLinks}
      />
    </div>
  );
}
