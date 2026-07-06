-- Kept v1.4 — recurring invoices + price book.

-- Recurring invoices: mark an invoice as repeating monthly; the daily cron
-- auto-creates the next one and emails the owner. Generated copies don't
-- recur themselves (recurs stays null on children).
alter table public.lf_invoices
  add column if not exists recurs text check (recurs in ('monthly')),
  add column if not exists next_recurrence date;

create index if not exists lf_invoices_recurring_idx
  on public.lf_invoices (next_recurrence) where recurs is not null;

-- Price book: the owner's saved line items ({description, unit_price}[]),
-- one click to drop them into any invoice or quote.
alter table public.lf_settings
  add column if not exists price_book jsonb not null default '[]';
