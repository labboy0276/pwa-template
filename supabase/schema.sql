-- Shared PWA backend schema.
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL -> New query) for
-- the single project ("PWAs") that backs all your apps. Every app reuses this
-- same table; you do not need to re-run it per app.
--
-- One generic key/value table serves every app: a row is identified by
-- (user_id, app, key) and holds a JSON blob. Each row is PRIVATE to the user
-- who created it, so two people using the same app never see each other's data.

create table if not exists public.kv (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  app        text not null,
  key        text not null,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, app, key)
);

-- Keep updated_at fresh on every update.
create or replace function public.kv_touch() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists kv_touch on public.kv;
create trigger kv_touch before update on public.kv
  for each row execute function public.kv_touch();

-- Row-level security: you can only read or write your own rows.
--
-- This makes data PERSONAL (per user). To make an app's data SHARED between
-- signed-in people instead, replace `user_id = auth.uid()` below with
-- `auth.uid() is not null` (any signed-in user can read/write every row).
alter table public.kv enable row level security;

drop policy if exists "kv is private to its owner" on public.kv;
create policy "kv is private to its owner" on public.kv
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime: broadcast changes so your other signed-in devices update live.
-- (Idempotent — safe to re-run.)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'kv'
  ) then
    alter publication supabase_realtime add table public.kv;
  end if;
end $$;
