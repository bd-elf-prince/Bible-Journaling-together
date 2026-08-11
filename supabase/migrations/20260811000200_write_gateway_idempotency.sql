-- Server-only idempotency records for anonymous/member write bursts.

create table if not exists public.request_idempotency (
  idempotency_hash text primary key,
  action text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.request_idempotency enable row level security;
revoke all on table public.request_idempotency from public, anon, authenticated;
grant select, insert, update, delete on table public.request_idempotency to service_role;

create index if not exists request_idempotency_created_idx
  on public.request_idempotency (created_at);

create or replace function public.claim_request_idempotency(
  p_idempotency_hash text,
  p_action text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_rows integer;
begin
  if p_idempotency_hash is null
     or length(p_idempotency_hash) < 16
     or p_action is null
     or length(p_action) not between 1 and 80 then
    return false;
  end if;

  insert into public.request_idempotency (idempotency_hash, action)
  values (p_idempotency_hash, p_action)
  on conflict (idempotency_hash) do nothing;

  get diagnostics v_rows = row_count;

  if random() < 0.01 then
    delete from public.request_idempotency
    where idempotency_hash in (
      select idempotency_hash
      from public.request_idempotency
      where created_at < clock_timestamp() - interval '1 day'
      order by created_at
      limit 1000
    );
  end if;

  return v_rows = 1;
end;
$$;

revoke all on function public.claim_request_idempotency(text, text)
  from public, anon, authenticated;
grant execute on function public.claim_request_idempotency(text, text)
  to service_role;
