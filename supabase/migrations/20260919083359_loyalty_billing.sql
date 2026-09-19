-- Backend-only billing state. No client can assign their own customer or loyalty level.
create table public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_id text unique,
  creation_key uuid not null default gen_random_uuid(),
  checkout_key uuid not null default gen_random_uuid(),
  checkout_session_id text,
  created_at timestamptz not null default now()
);
create table public.billing_paid_periods (
  subscription_id text not null,
  period_start bigint not null,
  period_end bigint not null check (period_end > period_start),
  invoice_id text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(subscription_id, period_start)
);
create index billing_paid_periods_user_id on public.billing_paid_periods(user_id);
create table public.billing_locks (
  name text primary key,
  owner uuid not null,
  expires_at timestamptz not null
);
alter table public.billing_accounts enable row level security;
alter table public.billing_paid_periods enable row level security;
alter table public.billing_locks enable row level security;
revoke all on public.billing_accounts, public.billing_paid_periods, public.billing_locks from public, anon, authenticated;
grant all on public.billing_accounts, public.billing_paid_periods, public.billing_locks to service_role;

-- SECURITY INVOKER: only service_role can execute or access the lock table.
-- The ten-minute lease exceeds the hosted Edge Function execution lifetime.
create function public.billing_claim_lock(lock_name text, owner uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare acquired boolean;
begin
  insert into public.billing_locks as locks(name, owner, expires_at)
  values(lock_name, owner, now() + interval '10 minutes')
  on conflict(name) do update set owner = excluded.owner, expires_at = excluded.expires_at
    where locks.expires_at < now()
  returning true into acquired;
  return coalesce(acquired, false);
end;
$$;
create function public.billing_release_lock(lock_name text, owner uuid) returns void
language sql security invoker set search_path = '' as $$
  delete from public.billing_locks where name = lock_name and billing_locks.owner = billing_release_lock.owner;
$$;
revoke all on function public.billing_claim_lock(text, uuid), public.billing_release_lock(text, uuid) from public, anon, authenticated;
grant execute on function public.billing_claim_lock(text, uuid), public.billing_release_lock(text, uuid) to service_role;
