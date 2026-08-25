-- Closes a real privilege-escalation hole: the "profiles: update own or
-- admin" policy in 0002_rls.sql only checks row ownership (id = auth.uid()),
-- not which columns are being changed. As written, any signed-in user could
-- call `update profiles set role = 'admin' where id = auth.uid()` from the
-- client and it would succeed, since RLS operates at the row level, not the
-- column level. A `with check` clause can't fix this alone because it has
-- no way to compare against the pre-update value — only a trigger can.

create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- auth.uid() is null when the update runs outside a normal authenticated
  -- client session — e.g. the Supabase SQL Editor, which is how the very
  -- first admin gets promoted (see supabase/README.md). That trusted path
  -- must stay open, or there would be no way to create an admin at all.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change a profile''s role.';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();
