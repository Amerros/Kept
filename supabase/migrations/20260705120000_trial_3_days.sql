-- Shorten the free trial from 14 days to 3 days.
-- The column already exists (from 20260705000000); this just changes its default.
alter table public.lf_businesses
  alter column trial_ends_at set default (now() + interval '3 days');
