-- Run once in the Supabase SQL Editor to repair the Facebook group URL validation.
alter table public.facebook_groups
  drop constraint if exists facebook_groups_facebook_url_check;

alter table public.facebook_groups
  add constraint facebook_groups_facebook_url_check
  check (facebook_url ~* '^https://(www\.)?facebook\.com/');
