-- Terminator AI private searchable knowledge library
create table if not exists public.terminator_ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  content text not null check (char_length(content) between 1 and 30000),
  tags text[] not null default '{}',
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists terminator_ai_knowledge_user_updated_idx
  on public.terminator_ai_knowledge(user_id, updated_at desc);
create index if not exists terminator_ai_knowledge_search_idx
  on public.terminator_ai_knowledge using gin (to_tsvector('simple', title || ' ' || content));
create index if not exists terminator_ai_knowledge_content_fts_idx
  on public.terminator_ai_knowledge using gin (to_tsvector('simple', content));
alter table public.terminator_ai_knowledge enable row level security;
drop policy if exists "Members manage their own Terminator knowledge" on public.terminator_ai_knowledge;
create policy "Members manage their own Terminator knowledge"
  on public.terminator_ai_knowledge for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
