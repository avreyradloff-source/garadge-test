-- Run this in Supabase SQL Editor. No service-role key belongs in the website.
create table if not exists public.garage_backups (
 user_id uuid primary key references auth.users(id) on delete cascade,
 garage_data jsonb not null,
 updated_at timestamptz not null default now()
);
alter table public.garage_backups enable row level security;
revoke all on public.garage_backups from anon;
grant select, insert, update, delete on public.garage_backups to authenticated;
drop policy if exists "Users read own garage" on public.garage_backups;
create policy "Users read own garage" on public.garage_backups for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users insert own garage" on public.garage_backups;
create policy "Users insert own garage" on public.garage_backups for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own garage" on public.garage_backups;
create policy "Users update own garage" on public.garage_backups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete own garage" on public.garage_backups;
create policy "Users delete own garage" on public.garage_backups for delete to authenticated using ((select auth.uid()) = user_id);
