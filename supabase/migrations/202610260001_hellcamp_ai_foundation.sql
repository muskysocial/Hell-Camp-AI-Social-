-- HELL CAMP AI foundation. Additive, isolated tables; existing product tables/functions are untouched.
create table if not exists public.hellcamp_ai_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'New conversation' check (char_length(title) between 1 and 160),
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_message_at timestamptz not null default now()
);
create table if not exists public.hellcamp_ai_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.hellcamp_ai_conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('user','assistant','tool')),
 content text not null check (char_length(content) <= 20000),
 model text, tool_name text, metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists public.hellcamp_ai_memories (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 memory text not null check (char_length(memory) between 1 and 2000),
 memory_type text not null default 'preference' check (memory_type in ('preference','project_context','user_fact','instruction')),
 source text not null default 'user', active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.hellcamp_ai_tool_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 conversation_id uuid references public.hellcamp_ai_conversations(id) on delete set null,
 tool_name text not null check (char_length(tool_name) between 1 and 120),
 status text not null default 'pending' check (status in ('pending','succeeded','failed','cancelled')),
 input_summary jsonb not null default '{}'::jsonb, result_summary jsonb not null default '{}'::jsonb,
 error_code text, created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.hellcamp_ai_feedback (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 conversation_id uuid not null references public.hellcamp_ai_conversations(id) on delete cascade,
 message_id uuid references public.hellcamp_ai_messages(id) on delete set null,
 rating smallint not null check (rating between 1 and 5),
 feedback text check (feedback is null or char_length(feedback) <= 2000),
 created_at timestamptz not null default now()
);
create table if not exists public.hellcamp_ai_health_checks (
 id uuid primary key default gen_random_uuid(),
 check_name text not null check (char_length(check_name) between 1 and 120),
 status text not null check (status in ('healthy','warning','failed')),
 details jsonb not null default '{}'::jsonb, checked_at timestamptz not null default now()
);
create index if not exists hellcamp_ai_conversations_user_updated_idx on public.hellcamp_ai_conversations(user_id, updated_at desc);
create index if not exists hellcamp_ai_messages_conversation_created_idx on public.hellcamp_ai_messages(conversation_id, created_at asc);
create index if not exists hellcamp_ai_messages_user_created_idx on public.hellcamp_ai_messages(user_id, created_at desc);
create index if not exists hellcamp_ai_memories_user_active_idx on public.hellcamp_ai_memories(user_id, active, updated_at desc);
create index if not exists hellcamp_ai_tool_runs_user_created_idx on public.hellcamp_ai_tool_runs(user_id, created_at desc);
create index if not exists hellcamp_ai_feedback_user_created_idx on public.hellcamp_ai_feedback(user_id, created_at desc);
create index if not exists hellcamp_ai_tool_runs_conversation_idx on public.hellcamp_ai_tool_runs(conversation_id);
create index if not exists hellcamp_ai_feedback_conversation_idx on public.hellcamp_ai_feedback(conversation_id);
create index if not exists hellcamp_ai_feedback_message_idx on public.hellcamp_ai_feedback(message_id);
alter table public.hellcamp_ai_conversations enable row level security;
alter table public.hellcamp_ai_messages enable row level security;
alter table public.hellcamp_ai_memories enable row level security;
alter table public.hellcamp_ai_tool_runs enable row level security;
alter table public.hellcamp_ai_feedback enable row level security;
alter table public.hellcamp_ai_health_checks enable row level security;
drop policy if exists hellcamp_ai_conversations_select_own on public.hellcamp_ai_conversations;
create policy hellcamp_ai_conversations_select_own on public.hellcamp_ai_conversations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_conversations_update_own on public.hellcamp_ai_conversations;
create policy hellcamp_ai_conversations_update_own on public.hellcamp_ai_conversations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_messages_select_own on public.hellcamp_ai_messages;
create policy hellcamp_ai_messages_select_own on public.hellcamp_ai_messages for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_memories_select_own on public.hellcamp_ai_memories;
create policy hellcamp_ai_memories_select_own on public.hellcamp_ai_memories for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_memories_insert_own on public.hellcamp_ai_memories;
create policy hellcamp_ai_memories_insert_own on public.hellcamp_ai_memories for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_memories_update_own on public.hellcamp_ai_memories;
create policy hellcamp_ai_memories_update_own on public.hellcamp_ai_memories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_memories_delete_own on public.hellcamp_ai_memories;
create policy hellcamp_ai_memories_delete_own on public.hellcamp_ai_memories for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_tool_runs_select_own on public.hellcamp_ai_tool_runs;
create policy hellcamp_ai_tool_runs_select_own on public.hellcamp_ai_tool_runs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_feedback_select_own on public.hellcamp_ai_feedback;
create policy hellcamp_ai_feedback_select_own on public.hellcamp_ai_feedback for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists hellcamp_ai_feedback_insert_own on public.hellcamp_ai_feedback;
create policy hellcamp_ai_feedback_insert_own on public.hellcamp_ai_feedback for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.hellcamp_ai_conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));
grant select on public.hellcamp_ai_conversations to authenticated;
grant update (title, metadata) on public.hellcamp_ai_conversations to authenticated;
grant select on public.hellcamp_ai_messages to authenticated;
grant select, insert, update, delete on public.hellcamp_ai_memories to authenticated;
grant select on public.hellcamp_ai_tool_runs to authenticated;
grant select, insert on public.hellcamp_ai_feedback to authenticated;
revoke all on public.hellcamp_ai_health_checks from anon, authenticated;

-- Atomic coin charge + message persistence for the HELL CAMP AI gateway.
create or replace function public.record_hellcamp_ai_exchange(
  p_user_id uuid, p_conversation_id uuid, p_request_key text, p_model text,
  p_user_message text, p_assistant_message text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_charge jsonb;
  v_balance integer;
  v_now timestamptz := now();
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_user_id is null or p_conversation_id is null
     or p_user_message is null or char_length(p_user_message) not between 1 and 4000
     or p_assistant_message is null or char_length(p_assistant_message) not between 1 and 20000 then
    raise exception 'invalid AI exchange payload' using errcode = '22023';
  end if;
  perform 1 from public.hellcamp_ai_conversations
    where id = p_conversation_id and user_id = p_user_id for update;
  if not found then raise exception 'conversation not found' using errcode = 'P0002'; end if;
  v_charge := public.charge_ai_generation(p_user_id, p_request_key, 'AI Chat');
  if coalesce((v_charge->>'ok')::boolean, false) is not true then return v_charge; end if;
  insert into public.hellcamp_ai_messages(conversation_id,user_id,role,content,model)
  values (p_conversation_id,p_user_id,'user',p_user_message,p_model),
         (p_conversation_id,p_user_id,'assistant',p_assistant_message,p_model);
  update public.hellcamp_ai_conversations set updated_at=v_now,last_message_at=v_now
    where id=p_conversation_id and user_id=p_user_id;
  v_balance := coalesce((v_charge->>'balance')::integer,0);
  return jsonb_build_object('ok',true,'balance',v_balance,'coin_balance',v_balance,
    'coins_charged',coalesce((v_charge->>'coins_charged')::integer,1400),
    'conversation_id',p_conversation_id);
end;
$$;
revoke all on function public.record_hellcamp_ai_exchange(uuid,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_hellcamp_ai_exchange(uuid,uuid,text,text,text,text) to service_role;
