-- PEAR Elite — Supabase schema
-- გაუშვი Supabase Dashboard → SQL Editor-ში

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'model' check (role in ('model', 'admin', 'head_admin')),
  model_id text,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_model_id_idx on public.profiles (model_id);

-- Models
create table if not exists public.models (
  id text primary key,
  name text not null,
  email text,
  tagline text default 'ელიტური მოდელი',
  avatar text,
  updated_at timestamptz not null default now()
);

-- Model points (leaderboard)
create table if not exists public.model_points (
  model_id text primary key references public.models(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  content text not null check (char_length(content) between 1 and 5000),
  pinned boolean not null default false,
  author text not null default 'ადმინისტრატორი',
  created_at timestamptz not null default now()
);

create index if not exists announcements_created_at_idx on public.announcements (created_at desc);
create index if not exists announcements_pinned_idx on public.announcements (pinned);

-- Activity log
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (char_length(action) between 1 and 500),
  user_name text not null default 'სისტემა',
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

-- Chat messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 2000),
  sender_uid uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_role text not null check (sender_role in ('model', 'admin', 'head_admin')),
  sender_avatar text,
  sender_model_id text,
  sender_email text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx on public.chat_messages (created_at);

-- Helper functions for RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'head_admin')
  );
$$;

create or replace function public.is_head_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'head_admin'
  );
$$;

create or replace function public.owns_model(target_model_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and model_id = target_model_id
  );
$$;

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

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  user_model_id text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'model');
  if lower(new.email) = 'admin@pear.elite' then
    user_role := 'head_admin';
  end if;

  if user_role in ('admin', 'head_admin') then
    user_model_id := null;
  else
    user_model_id := nullif(new.raw_user_meta_data->>'model_id', '');
  end if;

  insert into public.profiles (id, email, display_name, role, model_id)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    user_role,
    user_model_id
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.models enable row level security;
alter table public.model_points enable row level security;
alter table public.announcements enable row level security;
alter table public.activity_log enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles policies
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_head_admin" on public.profiles;
create policy "profiles_delete_head_admin"
  on public.profiles for delete
  to authenticated
  using (
    public.is_head_admin()
    and id != auth.uid()
    and role = 'admin'
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Models policies
drop policy if exists "models_select_authenticated" on public.models;
create policy "models_select_authenticated"
  on public.models for select
  to authenticated
  using (true);

drop policy if exists "models_insert_admin" on public.models;
create policy "models_insert_admin"
  on public.models for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "models_update_admin_or_owner" on public.models;
create policy "models_update_admin_or_owner"
  on public.models for update
  to authenticated
  using (public.is_admin() or public.owns_model(id))
  with check (public.is_admin() or public.owns_model(id));

drop policy if exists "models_delete_admin" on public.models;
create policy "models_delete_admin"
  on public.models for delete
  to authenticated
  using (public.is_admin());

-- Points policies
drop policy if exists "points_select_authenticated" on public.model_points;
create policy "points_select_authenticated"
  on public.model_points for select
  to authenticated
  using (true);

drop policy if exists "points_insert_authenticated" on public.model_points;
create policy "points_insert_authenticated"
  on public.model_points for insert
  to authenticated
  with check (true);

drop policy if exists "points_update_authenticated" on public.model_points;
create policy "points_update_authenticated"
  on public.model_points for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "points_delete_admin" on public.model_points;
create policy "points_delete_admin"
  on public.model_points for delete
  to authenticated
  using (public.is_admin());

-- Announcements policies
drop policy if exists "announcements_select_authenticated" on public.announcements;
create policy "announcements_select_authenticated"
  on public.announcements for select
  to authenticated
  using (true);

drop policy if exists "announcements_insert_admin" on public.announcements;
create policy "announcements_insert_admin"
  on public.announcements for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "announcements_update_admin" on public.announcements;
create policy "announcements_update_admin"
  on public.announcements for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "announcements_delete_admin" on public.announcements;
create policy "announcements_delete_admin"
  on public.announcements for delete
  to authenticated
  using (public.is_admin());

-- Activity log policies
drop policy if exists "activity_select_authenticated" on public.activity_log;
create policy "activity_select_authenticated"
  on public.activity_log for select
  to authenticated
  using (true);

drop policy if exists "activity_insert_authenticated" on public.activity_log;
create policy "activity_insert_authenticated"
  on public.activity_log for insert
  to authenticated
  with check (true);

drop policy if exists "activity_delete_admin" on public.activity_log;
create policy "activity_delete_admin"
  on public.activity_log for delete
  to authenticated
  using (public.is_admin());

-- Chat policies
drop policy if exists "chat_select_authenticated" on public.chat_messages;
create policy "chat_select_authenticated"
  on public.chat_messages for select
  to authenticated
  using (true);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own"
  on public.chat_messages for insert
  to authenticated
  with check (sender_uid = auth.uid());

drop policy if exists "chat_delete_own_or_admin" on public.chat_messages;
create policy "chat_delete_own_or_admin"
  on public.chat_messages for delete
  to authenticated
  using (sender_uid = auth.uid() or public.is_admin());

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('pear-images', 'pear-images', true)
on conflict (id) do update set public = true;

drop policy if exists "images_select_authenticated" on storage.objects;
create policy "images_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pear-images');

drop policy if exists "images_insert_authenticated" on storage.objects;
create policy "images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pear-images');

drop policy if exists "images_update_authenticated" on storage.objects;
create policy "images_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'pear-images');

drop policy if exists "images_delete_authenticated" on storage.objects;
create policy "images_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'pear-images');

-- Seed default announcement
insert into public.announcements (title, content, pinned, author)
select
  'კეთილი იყოს მობრძანება PEAR™ Elite-ში',
  'შენი ელიტური სამუშაო სისტემა აქტიურია. ატვირთე საუკეთესო ნამუშევრები და ავიდე ლიდერბორდში.',
  true,
  'ადმინისტრატორი'
where not exists (select 1 from public.announcements limit 1);

insert into public.activity_log (action, user_name)
select 'სისტემა გაეშვა', 'ადმინისტრატორი'
where not exists (select 1 from public.activity_log limit 1);

-- Realtime
alter publication supabase_realtime add table public.models;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.model_points;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.activity_log;
