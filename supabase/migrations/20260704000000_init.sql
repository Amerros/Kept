-- LeadFlow ("Kept") initial schema — v1, owner-only.
--
-- This Supabase project is shared with other apps, so:
--   * every LeadFlow object is prefixed lf_ (tables, functions, triggers)
--   * nothing here touches or replaces existing tables/functions
--
-- Multi-tenant: one auth user owns one business. Every domain row is scoped to a
-- business_id and locked down with RLS so an owner only ever sees their own data.
-- Server-side flows (public intake, cron worker) run with the service-role key.
--
-- v1 is owner-only: automations notify/remind the OWNER. Nothing is sent to
-- customers yet — customer-facing channels ship later.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh on any row update.
create or replace function public.lf_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- lf_businesses  (1 row per owner)
-- ---------------------------------------------------------------------------
create table public.lf_businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references auth.users (id) on delete cascade,
  name        text not null default 'My Business',
  timezone    text not null default 'UTC',
  -- public key used by the website intake form/endpoint (safe to expose)
  intake_key  text not null unique default encode(gen_random_bytes(9), 'hex'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger lf_businesses_updated_at
  before update on public.lf_businesses
  for each row execute function public.lf_set_updated_at();

-- Convenience: the set of business ids owned by the current auth user.
create or replace function public.lf_owned_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.lf_businesses where owner_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- lf_settings  (1:1 with business)
-- ---------------------------------------------------------------------------
create table public.lf_settings (
  business_id            uuid primary key references public.lf_businesses (id) on delete cascade,
  -- Customer-facing instant reply (NOT active in v1 — kept for when it ships).
  instant_reply_enabled  boolean not null default false,
  instant_reply_channel  text not null default 'email' check (instant_reply_channel in ('email','sms','whatsapp')),
  instant_reply_template text not null default
    'Hi {{name}}, thanks for reaching out! We''ve received your message and will get back to you shortly.',
  -- Owner notifications (the v1 core).
  new_lead_alert_enabled boolean not null default true,
  reminder_enabled       boolean not null default true,
  reminder_delay_minutes integer not null default 30,
  notify_email           text,
  from_email             text,
  from_name              text,
  business_address       text,   -- shown on invoices
  whatsapp_from          text,
  sms_from               text,
  -- Invoice defaults.
  invoice_prefix         text not null default 'INV',
  invoice_currency       text not null default 'EUR',
  invoice_tax_rate       numeric not null default 21,
  invoice_footer         text,
  updated_at             timestamptz not null default now()
);

create trigger lf_settings_updated_at
  before update on public.lf_settings
  for each row execute function public.lf_set_updated_at();

-- ---------------------------------------------------------------------------
-- lf_followup_steps  (the automated sequence: default 1h / 24h / 3d)
-- v1: all default steps are owner reminders; customer channels ship later.
-- ---------------------------------------------------------------------------
create table public.lf_followup_steps (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.lf_businesses (id) on delete cascade,
  step_order    integer not null,
  delay_minutes integer not null,          -- delay from lead creation
  channel       text not null default 'reminder' check (channel in ('email','sms','whatsapp','reminder')),
  template      text not null,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (business_id, step_order)
);

-- ---------------------------------------------------------------------------
-- lf_leads
-- ---------------------------------------------------------------------------
create table public.lf_leads (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null references public.lf_businesses (id) on delete cascade,
  name              text,
  email             text,
  phone             text,
  source            text not null default 'website' check (source in ('website','whatsapp','email','manual')),
  message           text,
  status            text not null default 'new' check (status in ('new','contacted','won','lost')),
  notes             text,                  -- owner's private notes
  last_contacted_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index lf_leads_business_status_idx on public.lf_leads (business_id, status);
create index lf_leads_business_created_idx on public.lf_leads (business_id, created_at desc);

create trigger lf_leads_updated_at
  before update on public.lf_leads
  for each row execute function public.lf_set_updated_at();

-- ---------------------------------------------------------------------------
-- lf_follow_ups  (scheduled jobs; the cron worker processes rows where run_at <= now)
-- ---------------------------------------------------------------------------
create table public.lf_follow_ups (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.lf_businesses (id) on delete cascade,
  lead_id      uuid not null references public.lf_leads (id) on delete cascade,
  step_id      uuid references public.lf_followup_steps (id) on delete set null,
  kind         text not null default 'followup' check (kind in ('instant','followup','reminder')),
  channel      text not null default 'reminder' check (channel in ('email','sms','whatsapp','reminder')),
  template     text not null,
  run_at       timestamptz not null,
  status       text not null default 'pending' check (status in ('pending','sent','skipped','failed','cancelled')),
  sent_at      timestamptz,
  error        text,
  attempts     integer not null default 0,
  created_at   timestamptz not null default now()
);

create index lf_follow_ups_due_idx on public.lf_follow_ups (run_at) where status = 'pending';
create index lf_follow_ups_lead_idx on public.lf_follow_ups (lead_id);

-- ---------------------------------------------------------------------------
-- lf_messages  (immutable log of everything sent/received)
-- ---------------------------------------------------------------------------
create table public.lf_messages (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.lf_businesses (id) on delete cascade,
  lead_id      uuid references public.lf_leads (id) on delete set null,
  direction    text not null check (direction in ('outbound','inbound')),
  channel      text not null check (channel in ('email','sms','whatsapp','reminder')),
  to_addr      text,
  from_addr    text,
  body         text,
  status       text not null default 'sent' check (status in ('sent','failed','received')),
  provider_id  text,
  error        text,
  created_at   timestamptz not null default now()
);

create index lf_messages_lead_idx on public.lf_messages (lead_id, created_at desc);
create index lf_messages_business_idx on public.lf_messages (business_id, created_at desc);

-- ---------------------------------------------------------------------------
-- lf_invoices  (line items stored as jsonb: [{description, qty, unit_price}])
-- ---------------------------------------------------------------------------
create table public.lf_invoices (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.lf_businesses (id) on delete cascade,
  lead_id        uuid references public.lf_leads (id) on delete set null,
  number         text not null,
  status         text not null default 'draft' check (status in ('draft','sent','paid','void')),
  client_name    text not null default '',
  client_email   text,
  client_address text,
  issue_date     date not null default current_date,
  due_date       date,
  currency       text not null default 'EUR',
  tax_rate       numeric not null default 0,   -- percent
  discount       numeric not null default 0,   -- flat amount, pre-tax
  items          jsonb not null default '[]',
  notes          text,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, number)
);

create index lf_invoices_business_idx on public.lf_invoices (business_id, created_at desc);

create trigger lf_invoices_updated_at
  before update on public.lf_invoices
  for each row execute function public.lf_set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.lf_businesses     enable row level security;
alter table public.lf_settings       enable row level security;
alter table public.lf_followup_steps enable row level security;
alter table public.lf_leads          enable row level security;
alter table public.lf_follow_ups     enable row level security;
alter table public.lf_messages       enable row level security;
alter table public.lf_invoices       enable row level security;

-- businesses: owner-only
create policy "lf own business - select" on public.lf_businesses
  for select using (owner_id = auth.uid());
create policy "lf own business - update" on public.lf_businesses
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Child tables: access rows whose business_id is owned by the current user.
create policy "lf own settings" on public.lf_settings
  for all using (business_id in (select public.lf_owned_business_ids()))
  with check (business_id in (select public.lf_owned_business_ids()));

create policy "lf own followup_steps" on public.lf_followup_steps
  for all using (business_id in (select public.lf_owned_business_ids()))
  with check (business_id in (select public.lf_owned_business_ids()));

create policy "lf own leads" on public.lf_leads
  for all using (business_id in (select public.lf_owned_business_ids()))
  with check (business_id in (select public.lf_owned_business_ids()));

create policy "lf own follow_ups" on public.lf_follow_ups
  for all using (business_id in (select public.lf_owned_business_ids()))
  with check (business_id in (select public.lf_owned_business_ids()));

create policy "lf own messages" on public.lf_messages
  for all using (business_id in (select public.lf_owned_business_ids()))
  with check (business_id in (select public.lf_owned_business_ids()));

create policy "lf own invoices" on public.lf_invoices
  for all using (business_id in (select public.lf_owned_business_ids()))
  with check (business_id in (select public.lf_owned_business_ids()));

-- ---------------------------------------------------------------------------
-- Grants — new tables in public are NOT auto-exposed to the Data API roles
-- anymore, so grant explicitly. anon gets nothing: the public intake endpoint
-- goes through our own API route running with the service-role key.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete
  on public.lf_businesses, public.lf_settings, public.lf_followup_steps,
     public.lf_leads, public.lf_follow_ups, public.lf_messages, public.lf_invoices
  to authenticated, service_role;

grant execute on function public.lf_owned_business_ids() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Onboarding: when a user signs up, provision their business + defaults.
-- (Named lf_* and additive — coexists with other apps' auth.users triggers.)
-- ---------------------------------------------------------------------------
create or replace function public.lf_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
  owner_name text;
begin
  -- Only provision users who signed up through Kept (the app sets this flag),
  -- so signups from the other apps sharing this project are left alone.
  if coalesce(new.raw_user_meta_data->>'lf_app', '') <> 'kept' then
    return new;
  end if;

  owner_name := coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'My Business');

  insert into public.lf_businesses (owner_id, name)
  values (new.id, owner_name)
  returning id into new_business_id;

  insert into public.lf_settings (business_id, notify_email)
  values (new_business_id, new.email);

  -- Default 3-step sequence — v1 is owner-only, so every step is a reminder
  -- to the owner (no messages go to the lead). Timed at 24h/48h/3d rather
  -- than 1h/24h/3d: the cron worker runs at most once a day on Hobby-tier
  -- Vercel, so a sub-day first reminder isn't realistic to deliver on time.
  insert into public.lf_followup_steps (business_id, step_order, delay_minutes, channel, template) values
    (new_business_id, 1, 1440, 'reminder',
      '{{name}} enquired yesterday and hasn''t heard back from you yet. A quick reply now wins the job.'),
    (new_business_id, 2, 2880, 'reminder',
      'It''s been 2 days since {{name}} reached out. Leads go cold fast — call or message them today.'),
    (new_business_id, 3, 4320, 'reminder',
      '{{name}} has been open for 3 days. Follow up one more time or mark them as lost.');

  return new;
end;
$$;

create trigger lf_on_auth_user_created
  after insert on auth.users
  for each row execute function public.lf_handle_new_user();
