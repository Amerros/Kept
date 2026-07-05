-- Kept v1.3 — hosted lead page, appointments, overdue invoice alerts.

-- Book a date/time on a lead (agenda + .ics download).
alter table public.lf_leads
  add column if not exists appointment_at timestamptz;

-- Cron alerts the owner once when an invoice goes overdue.
alter table public.lf_invoices
  add column if not exists overdue_notified_at timestamptz;

-- Hosted lead page (rkept.com/p/<intake_key>): public mini-site with a form.
alter table public.lf_settings
  add column if not exists page_enabled boolean not null default true,
  add column if not exists page_tagline text,
  add column if not exists page_services text;
