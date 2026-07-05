-- Shift the default reminder sequence from 1h/24h/3d to 24h/48h/3d.
-- The cron worker runs at most once a day on Vercel's Hobby plan, so a
-- 1-hour first reminder was never realistic — this makes the promise match
-- what actually gets delivered. Re-defines lf_handle_new_user() so future
-- signups get the new defaults; existing businesses are unaffected.

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
  if coalesce(new.raw_user_meta_data->>'lf_app', '') <> 'kept' then
    return new;
  end if;

  owner_name := coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'My Business');

  insert into public.lf_businesses (owner_id, name)
  values (new.id, owner_name)
  returning id into new_business_id;

  insert into public.lf_settings (business_id, notify_email)
  values (new_business_id, new.email);

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
