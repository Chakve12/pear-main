-- Full account deletion (auth.users + profiles + linked model)
create or replace function public.delete_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
  target_model_id text;
begin
  if not public.is_head_admin() then
    raise exception 'მხოლოდ უფროს ადმინს შეუძლია ანგარიშის წაშლა';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'საკუთარი ანგარიშის წაშლა შეუძლებელია';
  end if;

  select role, model_id
  into target_role, target_model_id
  from public.profiles
  where id = target_user_id;

  if not found then
    raise exception 'ანგარიში ვერ მოიძებნა';
  end if;

  if target_role = 'head_admin' then
    raise exception 'უფროს ადმინის ანგარიში ვერ წაიშლება';
  end if;

  if target_model_id is not null then
    delete from public.model_points where model_id = target_model_id;
    delete from public.models where id = target_model_id;
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_account(uuid) from public;
grant execute on function public.delete_account(uuid) to authenticated;
