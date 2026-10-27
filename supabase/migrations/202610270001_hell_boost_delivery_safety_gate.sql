-- Hell Boost delivery safety gate.
-- The existing coin-order RPC deducts coins before writing an order. This trigger
-- runs in the same transaction, so a missing provider aborts the transaction
-- and PostgreSQL rolls back the wallet deduction as well.
create table if not exists public.hell_boost_delivery_config (
  id boolean primary key default true check (id = true),
  provider_name text,
  provider_endpoint text,
  live_delivery_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.hell_boost_delivery_config enable row level security;
comment on table public.hell_boost_delivery_config is
  'Server-only Hell Boost delivery readiness. Never store API secrets in this table; use Supabase Edge Function secrets. No client policies are intentionally defined.';

create or replace function public.guard_hell_boost_order_delivery()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.hell_boost_delivery_config c
    where c.id = true
      and c.live_delivery_enabled = true
      and nullif(trim(c.provider_name), '') is not null
      and nullif(trim(c.provider_endpoint), '') is not null
  ) then
    raise exception 'Hell Boost delivery is not connected yet. No coins were deducted; please try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_hell_boost_order_delivery on public.growth_service_orders;
create trigger trg_guard_hell_boost_order_delivery
before insert on public.growth_service_orders
for each row
when (new.coins_charged > 0)
execute function public.guard_hell_boost_order_delivery();

-- Intentionally no provider row is inserted here. Live coin orders stay blocked
-- until an authorized provider is connected and tested.
