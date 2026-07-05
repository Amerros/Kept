-- Kept v1.1 — Gmail OAuth connections + Stripe billing fields.
-- Additive only; same rules as init: lf_ prefix, explicit grants, other apps untouched.

-- ---------------------------------------------------------------------------
-- lf_email_connections: "send as your own email" (Gmail OAuth, send-only scope).
-- One connection per business. Tokens are written/read by the server only.
-- ---------------------------------------------------------------------------
create table public.lf_email_connections (
  business_id             uuid primary key references public.lf_businesses (id) on delete cascade,
  provider                text not null default 'gmail' check (provider in ('gmail','outlook')),
  email                   text not null,
  refresh_token           text not null,
  access_token            text,
  access_token_expires_at timestamptz,
  connected_at            timestamptz not null default now()
);

alter table public.lf_email_connections enable row level security;

-- Owner may see + remove their connection; only the service role touches tokens.
create policy "lf own email connection - select" on public.lf_email_connections
  for select using (business_id in (select public.lf_owned_business_ids()));
create policy "lf own email connection - delete" on public.lf_email_connections
  for delete using (business_id in (select public.lf_owned_business_ids()));

-- Column-level grants: authenticated users can never read the tokens.
grant select (business_id, provider, email, connected_at), delete
  on public.lf_email_connections to authenticated;
grant select, insert, update, delete on public.lf_email_connections to service_role;

-- ---------------------------------------------------------------------------
-- Billing fields on lf_businesses (Stripe payment links + webhook).
-- ---------------------------------------------------------------------------
alter table public.lf_businesses
  add column plan text not null default 'trial'
    check (plan in ('trial','solo','standard','pro')),
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column trial_ends_at timestamptz not null default (now() + interval '3 days');
