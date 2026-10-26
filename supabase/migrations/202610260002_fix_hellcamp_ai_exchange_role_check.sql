-- Fix HELL CAMP AI exchange persistence with Supabase secret API keys.
-- Authorization remains enforced by EXECUTE grants: service_role only.
CREATE OR REPLACE FUNCTION public.record_hellcamp_ai_exchange(
  p_user_id uuid,
  p_conversation_id uuid,
  p_request_key text,
  p_model text,
  p_user_message text,
  p_assistant_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_charge jsonb;
  v_balance integer;
  v_now timestamptz := now();
begin
  -- Do not depend on request.jwt.claim.role: newer Supabase secret API keys
  -- can be gateway-authenticated without that legacy JWT setting populated.
  -- Direct callers are still restricted by the EXECUTE grants below.
  if p_user_id is null or p_conversation_id is null
     or p_user_message is null or char_length(p_user_message) not between 1 and 4000
     or p_assistant_message is null or char_length(p_assistant_message) not between 1 and 20000 then
    raise exception 'invalid AI exchange payload' using errcode = '22023';
  end if;

  perform 1 from public.hellcamp_ai_conversations
    where id = p_conversation_id and user_id = p_user_id for update;
  if not found then
    raise exception 'conversation not found' using errcode = 'P0002';
  end if;

  v_charge := public.charge_ai_generation(p_user_id, p_request_key, 'AI Chat');
  if coalesce((v_charge->>'ok')::boolean, false) is not true then
    return v_charge;
  end if;

  insert into public.hellcamp_ai_messages(conversation_id, user_id, role, content, model)
  values
    (p_conversation_id, p_user_id, 'user', p_user_message, p_model),
    (p_conversation_id, p_user_id, 'assistant', p_assistant_message, p_model);

  update public.hellcamp_ai_conversations
    set updated_at = v_now, last_message_at = v_now
    where id = p_conversation_id and user_id = p_user_id;

  v_balance := coalesce((v_charge->>'balance')::integer, 0);
  return jsonb_build_object(
    'ok', true,
    'balance', v_balance,
    'coin_balance', v_balance,
    'coins_charged', coalesce((v_charge->>'coins_charged')::integer, 1400),
    'conversation_id', p_conversation_id
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.record_hellcamp_ai_exchange(uuid,uuid,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_hellcamp_ai_exchange(uuid,uuid,text,text,text,text) TO service_role;
