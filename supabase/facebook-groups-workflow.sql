-- Execute once in the Supabase SQL Editor after organization-bootstrap.sql.
-- Stores only group metadata and user-entered URLs. It does not store Facebook credentials or automate posting.
create table public.facebook_groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  facebook_url text not null check (facebook_url ~* '^https://(www\\.)?facebook\\.com/'),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, facebook_url)
);

create table public.campaign_group_targets (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  facebook_group_id uuid not null references public.facebook_groups(id) on delete cascade,
  publication_status text not null default 'not_started' check (publication_status in ('not_started', 'opened', 'published', 'skipped')),
  published_at timestamptz,
  primary key (campaign_id, facebook_group_id)
);

alter table public.facebook_groups enable row level security;
alter table public.campaign_group_targets enable row level security;
revoke all on public.facebook_groups, public.campaign_group_targets from anon;
grant select, insert, update, delete on public.facebook_groups, public.campaign_group_targets to authenticated;

create policy "members select facebook groups" on public.facebook_groups for select to authenticated using ((select private.is_org_member(organization_id)));
create policy "members insert facebook groups" on public.facebook_groups for insert to authenticated with check ((select private.is_org_member(organization_id)));
create policy "members update facebook groups" on public.facebook_groups for update to authenticated using ((select private.is_org_member(organization_id))) with check ((select private.is_org_member(organization_id)));
create policy "members delete facebook groups" on public.facebook_groups for delete to authenticated using ((select private.is_org_member(organization_id)));

create policy "members select campaign group targets" on public.campaign_group_targets for select to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and (select private.is_org_member(c.organization_id))));
create policy "members insert campaign group targets" on public.campaign_group_targets for insert to authenticated with check (exists (select 1 from public.campaigns c join public.facebook_groups g on g.id = facebook_group_id where c.id = campaign_id and c.organization_id = g.organization_id and (select private.is_org_member(c.organization_id))));
create policy "members update campaign group targets" on public.campaign_group_targets for update to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and (select private.is_org_member(c.organization_id)))) with check (exists (select 1 from public.campaigns c join public.facebook_groups g on g.id = facebook_group_id where c.id = campaign_id and c.organization_id = g.organization_id and (select private.is_org_member(c.organization_id))));
create policy "members delete campaign group targets" on public.campaign_group_targets for delete to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and (select private.is_org_member(c.organization_id))));

create index facebook_groups_organization_id_idx on public.facebook_groups (organization_id);
create index campaign_group_targets_campaign_id_idx on public.campaign_group_targets (campaign_id);
