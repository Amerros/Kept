export type LeadStatus = "new" | "contacted" | "won" | "lost";
export type LeadSource = "website" | "whatsapp" | "email" | "manual";
export type Channel = "email" | "sms" | "whatsapp" | "reminder";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  appointment_at: string | null;
  created_at: string; // ISO
  last_contacted_at: string | null;
}

export interface Message {
  id: string;
  lead_id: string;
  direction: "outbound" | "inbound";
  channel: Channel;
  body: string;
  status: "sent" | "failed" | "received";
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  kind: "instant" | "followup" | "reminder";
  channel: Channel;
  template: string;
  run_at: string;
  status: "pending" | "sent" | "skipped" | "failed" | "cancelled";
}

export interface FollowupStep {
  id: string;
  step_order: number;
  delay_minutes: number;
  channel: Channel;
  template: string;
  enabled: boolean;
}

export type Plan = "trial" | "solo" | "standard" | "pro";

export interface BusinessSettings {
  business_id: string;
  business_name: string;
  intake_key: string;
  plan: Plan;
  trial_ends_at: string | null;
  instant_reply_enabled: boolean;
  instant_reply_channel: Channel;
  instant_reply_template: string;
  new_lead_alert_enabled: boolean;
  reminder_enabled: boolean;
  reminder_delay_minutes: number;
  notify_email: string;
  from_email: string;
  business_address: string;
  whatsapp_from: string;
  sms_from: string;
  sms_addon_enabled: boolean;
  invoice_prefix: string;
  invoice_currency: string;
  invoice_tax_rate: number;
  invoice_footer: string;
  reply_templates: string[];
  weekly_digest_enabled: boolean;
  price_book: PriceBookItem[];
  page_enabled: boolean;
  page_tagline: string;
  page_services: string;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

export interface InvoiceItem {
  description: string;
  qty: number;
  unit_price: number;
}

export type DocType = "invoice" | "quote";

export interface PriceBookItem {
  description: string;
  unit_price: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  doc_type: DocType;
  recurs: "monthly" | null;
  next_recurrence: string | null;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  issue_date: string; // yyyy-mm-dd
  due_date: string | null;
  currency: string;
  tax_rate: number;
  discount: number;
  items: InvoiceItem[];
  notes: string | null;
  paid_at: string | null;
  created_at: string;
}

/** Everything needed to render an invoice document (also used by the free public generator). */
export interface InvoiceDraft {
  doc_type: DocType;
  number: string;
  business_name: string;
  business_address: string;
  business_email: string;
  client_name: string;
  client_email: string;
  client_address: string;
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate: number;
  discount: number;
  items: InvoiceItem[];
  notes: string;
}

export function invoiceSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
}

export function invoiceTotals(items: InvoiceItem[], taxRate: number, discount: number) {
  const subtotal = invoiceSubtotal(items);
  const afterDiscount = Math.max(0, subtotal - (Number(discount) || 0));
  const tax = afterDiscount * ((Number(taxRate) || 0) / 100);
  return { subtotal, discount: Math.min(subtotal, Number(discount) || 0), tax, total: afterDiscount + tax };
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  won: "Won",
  lost: "Lost",
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website form",
  whatsapp: "WhatsApp",
  email: "Email",
  manual: "Added manually",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  void: "Void",
};
