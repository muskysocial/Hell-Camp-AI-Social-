-- Hell Camp Virtual Phone: private per-account state
-- Apply this migration to the Hell Camp Supabase project before enabling cloud sync.
create table if not exists public.virtual_phones (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.virtual_phones enable row level security;
revoke all on public.virtual_phones from anon;
grant select, insert, update, delete on public.virtual_phones to authenticated;
drop policy if exists "Users can read their own virtual phone" on public.virtual_phones;
create policy "Users can read their own virtual phone"
  on public.virtual_phones for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own virtual phone" on public.virtual_phones;
create policy "Users can create their own virtual phone"
  on public.virtual_phones for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own virtual phone" on public.virtual_phones;
create policy "Users can update their own virtual phone"
  on public.virtual_phones for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own virtual phone" on public.virtual_phones;
create policy "Users can delete their own virtual phone"
  on public.virtual_phones for delete to authenticated
  using ((select auth.uid()) = user_id);
