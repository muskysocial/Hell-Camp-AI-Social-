-- HELL CAMP Cyber Lab: member-owned run history and a server-only 20,000-coin charge.
alter table public.ai_generation_charges drop constraint if exists ai_generation_charges_coins_charged_check;
alter table public.ai_generation_charges add constraint ai_generation_charges_coins_charged_check check (coins_charged in (1400, 20000));

create table if not exists public.hellcamp_cyber_lab_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('learn','ctf','audit','code_review','incident_response')),
  title text not null check (char_length(title) between 1 and 160),
  prompt text not null check (char_length(prompt) between 1 and 4000),
  result text not null check (char_length(result) between 1 and 20000),
  coins_charged integer not null default 20000 check (coins_charged = 20000),
  created_at timestamptz not null default now()
);
alter table public.hellcamp_cyber_lab_runs enable row level security;
drop policy if exists hellcamp_cyber_lab_runs_select_own on public.hellcamp_cyber_lab_runs;
create policy hellcamp_cyber_lab_runs_select_own on public.hellcamp_cyber_lab_runs
  for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.hellcamp_cyber_lab_runs to authenticated;
revoke all on public.hellcamp_cyber_lab_runs from anon;

create or replace function public.record_hellcamp_cyber_lab_run(
  p_user_id uuid, p_request_key text, p_mode text, p_title text, p_prompt text, p_result text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_paid integer := 0;
  v_daily integer := 0;
  v_take_daily integer := 0;
  v_take_paid integer := 0;
  v_run public.hellcamp_cyber_lab_runs%rowtype;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_user_id is null or p_request_key is null or p_request_key !~ '^[A-Za-z0-9:_-]{8,180}$'
     or p_mode not in ('learn','ctf','audit','code_review','incident_response')
     or p_title is null or char_length(p_title) not between 1 and 160
     or p_prompt is null or char_length(p_prompt) not between 1 and 4000
     or p_result is null or char_length(p_result) not between 1 and 20000 then
    raise exception 'invalid Cyber Lab payload' using errcode = '22023';
  end if;
  perform 1 from public.profiles where id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok',false,'code','profile_missing','message','Your Hell Camp profile is not ready yet.');
  end if;
  -- Idempotency is backed by the charge ledger's unique request key.
  if exists(select 1 from public.ai_generation_charges where user_id=p_user_id and request_key=p_request_key) then
    select coalesce(paid_coins,0), case when daily_free_coins_expires_at is not null and daily_free_coins_expires_at <= now() then 0 else coalesce(daily_free_coins,0) end
      into v_paid,v_daily from public.profiles where id=p_user_id;
    return jsonb_build_object('ok',true,'already_charged',true,'coins_charged',20000,'balance',v_paid+v_daily);
  end if;
  update public.profiles set daily_free_coins=case when daily_free_coins_expires_at is not null and daily_free_coins_expires_at<=now() then 0 else coalesce(daily_free_coins,0) end,updated_at=now()
    where id=p_user_id;
  select coalesce(paid_coins,0),coalesce(daily_free_coins,0) into v_paid,v_daily from public.profiles where id=p_user_id;
  if v_paid+v_daily < 20000 then
    return jsonb_build_object('ok',false,'code','insufficient_coins','required',20000,'balance',v_paid+v_daily,'message','Cyber Lab costs 20,000 coins per completed run.');
  end if;
  v_take_daily := least(v_daily,20000);
  v_take_paid := 20000-v_take_daily;
  update public.profiles set daily_free_coins=greatest(0,coalesce(daily_free_coins,0)-v_take_daily),
    paid_coins=greatest(0,coalesce(paid_coins,0)-v_take_paid),updated_at=now()
    where id=p_user_id returning coalesce(paid_coins,0),coalesce(daily_free_coins,0) into v_paid,v_daily;
  insert into public.ai_generation_charges(user_id,request_key,tool_key,coins_charged)
    values(p_user_id,p_request_key,'Cyber Lab',20000);
  insert into public.hellcamp_cyber_lab_runs(user_id,mode,title,prompt,result,coins_charged)
    values(p_user_id,p_mode,p_title,p_prompt,p_result,20000) returning * into v_run;
  return jsonb_build_object('ok',true,'id',v_run.id,'coins_charged',20000,'balance',v_paid+v_daily);
end;
$$;
revoke all on function public.record_hellcamp_cyber_lab_run(uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_hellcamp_cyber_lab_run(uuid,text,text,text,text,text) to service_role;
