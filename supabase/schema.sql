-- Delight MFB — core schema (Milestone 1: auth, profiles, invite codes)
-- Run this in the Supabase SQL editor on a fresh project.

-- ========== TABLES ==========

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  cooperative_id text unique not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  code text primary key,
  is_used boolean not null default false,
  used_by uuid references auth.users (id),
  used_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  month_logged text not null, -- e.g. '2026-07'
  logged_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  principal numeric(12, 2) not null check (principal > 0),
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'disbursed', 'cleared', 'rejected')),
  due_date date,
  created_at timestamptz not null default now()
);

-- ========== REGISTRATION TRIGGER ==========
-- Atomically: validate + consume the invite code, generate/confirm a unique
-- Cooperative ID, and create the profile row — all inside the same
-- transaction as the auth.users insert. If the invite code is missing,
-- unknown, or already used, the entire signup is rolled back.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_full_name text;
  v_coop_id text;
  v_attempt int := 0;
begin
  v_code := new.raw_user_meta_data ->> 'invite_code';
  v_full_name := new.raw_user_meta_data ->> 'full_name';

  if v_code is null or length(trim(v_code)) = 0 then
    raise exception 'An invite code is required to register.';
  end if;

  update public.invite_codes
  set is_used = true, used_by = new.id, used_at = now()
  where code = v_code and is_used = false;

  if not found then
    raise exception 'This invite code is invalid or has already been used.';
  end if;

  -- Cooperative ID is just a display/reference number now (login uses
  -- email), so it's safe to generate and retry entirely inside the DB.
  loop
    v_coop_id := 'COOP-' || lpad(floor(random() * 100000)::text, 5, '0');
    begin
      insert into public.profiles (id, full_name, cooperative_id, role, status)
      values (new.id, coalesce(v_full_name, 'New Member'), v_coop_id, 'member', 'pending');
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 5 then
        raise exception 'Could not generate a unique cooperative ID — please try registering again.';
      end if;
    end;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== ROW LEVEL SECURITY ==========

alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.contributions enable row level security;
alter table public.loans enable row level security;

-- Helper: is the current user an active admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- profiles: members can read/update their own row; admins can read/update all.
create policy "Members can view their own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Members can update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

-- invite_codes: only admins can view or create them. The registration
-- trigger runs as security definer, so it bypasses these policies safely.
create policy "Admins manage invite codes"
  on public.invite_codes for all
  using (public.is_admin())
  with check (public.is_admin());

-- contributions: members view their own; admins view/manage all.
create policy "Members can view their own contributions"
  on public.contributions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can log contributions"
  on public.contributions for insert
  with check (public.is_admin());

create policy "Admins can update contributions"
  on public.contributions for update
  using (public.is_admin());

-- loans: members view/request their own; admins view/manage all.
create policy "Members can view their own loans"
  on public.loans for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Members can request their own loans"
  on public.loans for insert
  with check (auth.uid() = user_id);

create policy "Admins can update loans"
  on public.loans for update
  using (public.is_admin());

-- ========== BOOTSTRAP: YOUR FIRST ADMIN ==========
-- There's no signup flow for admins (by design). After you register your
-- own account through the normal /register flow with a one-off invite
-- code, run this once to promote yourself:
--
--   insert into public.invite_codes (code) values ('COOP-FOUNDER');
--   -- then register through the app using that code, and finally:
--   update public.profiles set role = 'admin', status = 'active'
--   where cooperative_id = 'PASTE-YOUR-NEW-COOPERATIVE-ID-HERE';
