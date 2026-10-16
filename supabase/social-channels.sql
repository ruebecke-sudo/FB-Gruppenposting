-- Execute in the Supabase SQL Editor before enabling live OAuth connections.
-- OAuth access tokens belong only in server-side secrets / encrypted backend storage, never in this table or the browser.
create type public.social_platform as enum ('facebook', 'instagram', 'x', 'tiktok', 'pinterest', 'bluesky', 'linkedin', 'whatsapp', 'youtube');

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform public.social_platform not null,
  external_account_id text not null,
  display_name text not null,
  connection_status text not null default 'connected' check (connection_status in ('connected', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  unique (organization_id, platform, external_account_id)
);

alter table public.social_accounts enable row level security;
revoke all on public.social_accounts from anon;
grant select, insert, update, delete on public.social_accounts to authenticated;

create policy "members manage social accounts" on public.social_accounts for all to authenticated
using ((select private.is_org_member(organization_id)))
with check ((select private.is_org_member(organization_id)));

create index social_accounts_organization_id_idx on public.social_accounts (organization_id);

-- Store OAuth tokens only in server-side secrets / an encrypted private schema.
-- Create OAuth callback handlers only after each provider's official developer app is approved.
