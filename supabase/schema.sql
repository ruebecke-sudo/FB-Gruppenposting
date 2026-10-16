-- Run this in a new Supabase project's SQL editor, then convert it to a CLI migration.
-- Every public table below has RLS enabled and no access is granted to anonymous users.
create type public.member_role as enum ('owner', 'admin', 'editor', 'reviewer');
create type public.post_status as enum ('draft', 'in_review', 'approved', 'scheduled', 'published', 'failed');
create table public.organizations (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table public.organization_members (organization_id uuid not null references public.organizations(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, role public.member_role not null default 'editor', primary key (organization_id, user_id));
create table public.campaigns (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now());
create table public.posts (id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.campaigns(id) on delete cascade, body text not null check (char_length(body) <= 500), status public.post_status not null default 'draft', scheduled_for timestamptz, created_at timestamptz not null default now());
create table public.audit_log (id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade, actor_id uuid references auth.users(id), action text not null, entity_type text not null, entity_id uuid, created_at timestamptz not null default now());
alter table public.organizations enable row level security; alter table public.organization_members enable row level security; alter table public.campaigns enable row level security; alter table public.posts enable row level security; alter table public.audit_log enable row level security;
revoke all on public.organizations, public.organization_members, public.campaigns, public.posts, public.audit_log from anon;
grant select, insert, update, delete on public.organizations, public.organization_members, public.campaigns, public.posts, public.audit_log to authenticated;
create function public.is_org_member(org_id uuid) returns boolean language sql stable security invoker set search_path = '' as $$ select exists (select 1 from public.organization_members m where m.organization_id = org_id and m.user_id = (select auth.uid())) $$;
create policy "members access organizations" on public.organizations for select to authenticated using (public.is_org_member(id));
create policy "members access membership" on public.organization_members for select to authenticated using (public.is_org_member(organization_id));
create policy "members access campaigns" on public.campaigns for all to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members access posts" on public.posts for all to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_org_member(c.organization_id))) with check (exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_org_member(c.organization_id)));
create policy "members read audit log" on public.audit_log for select to authenticated using (public.is_org_member(organization_id));
