-- Kept v1.5 — calendar subscription feed + outbound webhook.

-- Private token for the read-only .ics feed. Deliberately separate from
-- intake_key (which is visible in public form HTML) because the feed
-- exposes appointment/client details.
alter table public.lf_businesses
  add column if not exists calendar_key text unique
    default encode(gen_random_bytes(9), 'hex');

-- Outbound webhook: POSTed whenever a new lead arrives (Zapier/Make/custom).
alter table public.lf_settings
  add column if not exists webhook_url text;
