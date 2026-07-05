-- Kept v1.2 — tier build-out: quotes, reply templates, weekly digest.
-- Also (re-)applies the 3-day trial default; safe to run even if
-- 20260705120000_trial_3_days.sql already ran (both are idempotent).

alter table public.lf_businesses
  alter column trial_ends_at set default (now() + interval '3 days');

-- Reply templates (jsonb array of strings) + weekly digest prefs.
alter table public.lf_settings
  add column if not exists reply_templates jsonb not null default
    '["Hi {{name}}, thanks for reaching out! I''d be happy to help — when is a good moment to call you today?"]',
  add column if not exists weekly_digest_enabled boolean not null default true,
  add column if not exists last_digest_at timestamptz;

-- Quotes share the invoice table/editor; doc_type tells them apart.
alter table public.lf_invoices
  add column if not exists doc_type text not null default 'invoice'
    check (doc_type in ('invoice','quote'));
