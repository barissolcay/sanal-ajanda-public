create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  priority smallint not null default 0 check (priority in (0, 1, 2)),
  color text,
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  is_default boolean not null default false,
  "order" integer not null default 0,
  primary key (user_id, id)
);

create index if not exists tasks_user_id_start_date_idx
  on public.tasks (user_id, start_date);

create index if not exists tasks_user_id_status_idx
  on public.tasks (user_id, status);

create index if not exists tasks_user_id_category_idx
  on public.tasks (user_id, category);

create index if not exists categories_user_id_order_idx
  on public.categories (user_id, "order");

alter table public.tasks enable row level security;
alter table public.categories enable row level security;

drop policy if exists "Users can view own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;

create policy "Users can view own tasks"
  on public.tasks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view own categories" on public.categories;
drop policy if exists "Users can insert own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;

create policy "Users can view own categories"
  on public.categories
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
