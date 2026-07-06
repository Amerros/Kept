import type { Plan } from "./types";

/**
 * Plan tiers and what each unlocks — the single source of truth for gating.
 * Only features that actually work today are gated; unbuilt features (WhatsApp,
 * SMS, customer auto-replies) are marketing-only "coming soon" until they ship.
 *
 * Tiers:
 *   Solo (€9)      — capture, instant alerts, default reminders, invoices, pipeline
 *   Standard (€29) — + editable reminder sequence, lead notes, CSV export
 *   Pro (€49)      — + revenue analytics, VAT summary, weekly digest, overdue alerts
 *
 * During an active trial the owner gets full (Pro) access so they can try
 * everything. Once the trial expires without paying, they fall back to Solo.
 */

export type Feature =
  | "custom_sequence"
  | "lead_notes"
  | "csv_export"
  | "source_insights"
  | "quotes"
  | "custom_templates"
  | "page_customize"
  | "invoice_csv"
  | "recurring_invoices"
  | "price_book"
  | "webhook"
  | "weekly_digest"
  | "revenue_analytics"
  | "vat_summary"
  | "overdue_alerts";

const RANK: Record<Plan, number> = { solo: 1, standard: 2, pro: 3, trial: 3 };

const FEATURE_MIN_RANK: Record<Feature, number> = {
  custom_sequence: 2,
  lead_notes: 2,
  csv_export: 2,
  source_insights: 2,
  quotes: 2,
  custom_templates: 2,
  page_customize: 2,
  invoice_csv: 2,
  recurring_invoices: 2,
  price_book: 2,
  webhook: 3,
  weekly_digest: 3,
  revenue_analytics: 3,
  vat_summary: 3,
  overdue_alerts: 3,
};

/** Human plan a feature first appears on — used for upgrade prompts. */
export const FEATURE_MIN_PLAN: Record<Feature, "Standard" | "Pro"> = {
  custom_sequence: "Standard",
  lead_notes: "Standard",
  csv_export: "Standard",
  source_insights: "Standard",
  quotes: "Standard",
  custom_templates: "Standard",
  page_customize: "Standard",
  invoice_csv: "Standard",
  recurring_invoices: "Standard",
  price_book: "Standard",
  webhook: "Pro",
  weekly_digest: "Pro",
  revenue_analytics: "Pro",
  vat_summary: "Pro",
  overdue_alerts: "Pro",
};

/** Hard paywall: trial plan whose trial_ends_at has passed. Paid plans never lock. */
export function isLockedOut(plan: Plan, trialEndsAt?: string | null): boolean {
  if (plan !== "trial") return false;
  return trialEndsAt ? new Date(trialEndsAt).getTime() <= Date.now() : false;
}

/** Effective rank, accounting for an expired trial dropping to Solo. */
export function effectiveRank(plan: Plan, trialEndsAt?: string | null): number {
  if (plan === "trial") {
    const active = trialEndsAt ? new Date(trialEndsAt).getTime() > Date.now() : true;
    return active ? RANK.trial : RANK.solo;
  }
  return RANK[plan];
}

export function planAllows(plan: Plan, feature: Feature, trialEndsAt?: string | null): boolean {
  return effectiveRank(plan, trialEndsAt) >= FEATURE_MIN_RANK[feature];
}

export function upgradeMessage(feature: Feature): string {
  return `This is a ${FEATURE_MIN_PLAN[feature]} feature — upgrade in Settings → Billing to unlock it.`;
}
