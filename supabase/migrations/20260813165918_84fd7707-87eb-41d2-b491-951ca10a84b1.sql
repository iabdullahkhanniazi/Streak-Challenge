
create type public.app_role as enum ('admin','user');
create type public.task_type as enum ('checkbox','numeric');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  xp integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "own roles select" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  daily_target integer not null default 1,
  task_type public.task_type not null default 'checkbox',
  unit text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "own tasks" on public.tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  date date not null default current_date,
  completed_value integer not null default 0,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (task_id, date)
);
create index task_completions_user_date_idx on public.task_completions(user_id, date);
grant select, insert, update, delete on public.task_completions to authenticated;
grant all on public.task_completions to service_role;
alter table public.task_completions enable row level security;
create policy "own completions" on public.task_completions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_date date
);
grant select, insert, update on public.streaks to authenticated;
grant all on public.streaks to service_role;
alter table public.streaks enable row level security;
create policy "own streak select" on public.streaks for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own streak insert" on public.streaks for insert to authenticated with check (auth.uid() = user_id);
create policy "own streak update" on public.streaks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name',''))
    on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  insert into public.streaks (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
