begin;
create policy rankings_admin_insert on public.rankings for insert to authenticated with check (private.has_role('admin'));
create policy rankings_admin_update on public.rankings for update to authenticated using (private.has_role('admin')) with check (private.has_role('admin'));
create policy rankings_admin_delete on public.rankings for delete to authenticated using (private.has_role('admin'));
grant insert, update, delete on public.rankings to authenticated;
commit;
