-- One-time upgrade for installations that already ran schema.sql.
-- It creates the first-workspace flow without trusting client-supplied roles.
create schema if not exists private;

create or replace function private.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = (select auth.uid())
  )
$$;

create or replace function private.add_organization_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authenticated user required';
  end if;
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, (select auth.uid()), 'owner');
  return new;
end;
$$;

revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.add_organization_creator() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;

drop trigger if exists organization_creator_membership on public.organizations;
create trigger organization_creator_membership
after insert on public.organizations
for each row execute function private.add_organization_creator();

drop policy if exists "members access organizations" on public.organizations;
drop policy if exists "members create organizations" on public.organizations;
drop policy if exists "members access membership" on public.organization_members;
drop policy if exists "members access campaigns" on public.campaigns;
drop policy if exists "members access posts" on public.posts;
drop policy if exists "members read audit log" on public.audit_log;

create policy "members access organizations" on public.organizations for select to authenticated using ((select private.is_org_member(id)));
create policy "members create organizations" on public.organizations for insert to authenticated with check ((select auth.uid()) is not null);
create policy "members access membership" on public.organization_members for select to authenticated using ((select private.is_org_member(organization_id)));
create policy "members access campaigns" on public.campaigns for all to authenticated using ((select private.is_org_member(organization_id))) with check ((select private.is_org_member(organization_id)));
create policy "members access posts" on public.posts for all to authenticated using (exists (select 1 from public.campaigns c where c.id = campaign_id and (select private.is_org_member(c.organization_id)))) with check (exists (select 1 from public.campaigns c where c.id = campaign_id and (select private.is_org_member(c.organization_id))));
create policy "members read audit log" on public.audit_log for select to authenticated using ((select private.is_org_member(organization_id)));
