-- Remove the Gmail "send as your own email" feature. The OAuth flow is gone
-- from the app, so this table (which only ever stored Gmail tokens) is dead.
-- It was created empty and never used in production; safe to drop.
drop table if exists public.lf_email_connections;
