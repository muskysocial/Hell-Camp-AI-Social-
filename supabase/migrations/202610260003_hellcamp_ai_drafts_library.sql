-- Private, owner-scoped AI draft library for HELL CAMP members.
create table if not exists public.hellcamp_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  draft_type text not null default 'general' check (draft_type in ('post','bio','message','job','listing','event','learning','general')),
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists hellcamp_ai_drafts_user_updated_idx on public.hellcamp_ai_drafts(user_id, updated_at desc);
alter table public.hellcamp_ai_drafts enable row level security;
drop policy if exists hellcamp_ai_drafts_select_own on public.hellcamp_ai_drafts;
create policy hellcamp_ai_drafts_select_own on public.hellcamp_ai_drafts for select to authenticated using (user_id = auth.uid());
drop policy if exists hellcamp_ai_drafts_insert_own on public.hellcamp_ai_drafts;
create policy hellcamp_ai_drafts_insert_own on public.hellcamp_ai_drafts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists hellcamp_ai_drafts_update_own on public.hellcamp_ai_drafts;
create policy hellcamp_ai_drafts_update_own on public.hellcamp_ai_drafts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists hellcamp_ai_drafts_delete_own on public.hellcamp_ai_drafts;
create policy hellcamp_ai_drafts_delete_own on public.hellcamp_ai_drafts for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.hellcamp_ai_drafts to authenticated;
grant all on public.hellcamp_ai_drafts to service_role;