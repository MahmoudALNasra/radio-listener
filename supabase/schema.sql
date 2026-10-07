-- Radio keyword listener schema (Phase 1)
-- Apply via Supabase SQL editor or MCP apply_migration

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'driver' check (role in ('admin', 'driver')),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.devices (
  id text primary key,
  name text not null,
  audio_source text not null default 'cabin_mic'
    check (audio_source in ('cabin_mic', 'radio_line')),
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.radio_slots (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices (id) on delete cascade,
  label text not null,
  radio_family text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.keywords (
  id uuid primary key default gen_random_uuid(),
  text text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  device_id text not null references public.devices (id) on delete cascade,
  keyword text not null,
  transcript text,
  clip_path text,
  triggered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists events_triggered_at_idx on public.events (triggered_at desc);
create index if not exists events_device_id_idx on public.events (device_id);
create index if not exists radio_slots_device_id_idx on public.radio_slots (device_id);

alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.radio_slots enable row level security;
alter table public.keywords enable row level security;
alter table public.events enable row level security;

-- For early Lenovo testing: authenticated users can read/write.
-- Tighten roles later (admin vs driver via profiles.role / app_metadata).

create policy "authenticated read profiles"
  on public.profiles for select to authenticated using (true);
create policy "users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "authenticated read devices"
  on public.devices for select to authenticated using (true);
create policy "authenticated write devices"
  on public.devices for all to authenticated using (true) with check (true);

create policy "authenticated read radio_slots"
  on public.radio_slots for select to authenticated using (true);
create policy "authenticated write radio_slots"
  on public.radio_slots for all to authenticated using (true) with check (true);

create policy "authenticated read keywords"
  on public.keywords for select to authenticated using (true);
create policy "authenticated write keywords"
  on public.keywords for all to authenticated using (true) with check (true);

-- Devices may insert events using anon key during early test if you open this;
-- prefer service role or authenticated device user in production.
create policy "authenticated read events"
  on public.events for select to authenticated using (true);
create policy "authenticated insert events"
  on public.events for insert to authenticated with check (true);

-- Allow anon read of active keywords so the Lenovo listener can poll without a user session
create policy "anon read active keywords"
  on public.keywords for select to anon using (active = true);

create policy "anon insert events"
  on public.events for insert to anon with check (true);

create policy "anon read devices"
  on public.devices for select to anon using (true);
create policy "anon upsert devices"
  on public.devices for insert to anon with check (true);
create policy "anon update devices"
  on public.devices for update to anon using (true) with check (true);

insert into public.keywords (text, active) values
  ('crash', true),
  ('accident', true),
  ('rollover', true),
  ('pileup', true)
on conflict (text) do nothing;

insert into public.devices (id, name, audio_source)
values ('lenovo-dev-1', 'Lenovo Test Rig', 'cabin_mic')
on conflict (id) do nothing;

-- Storage bucket for clips (run in SQL if storage API available)
insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do nothing;

create policy "anon upload clips"
  on storage.objects for insert to anon
  with check (bucket_id = 'clips');

create policy "anon update clips"
  on storage.objects for update to anon
  using (bucket_id = 'clips');

create policy "authenticated read clips"
  on storage.objects for select to authenticated
  using (bucket_id = 'clips');

create policy "anon read clips"
  on storage.objects for select to anon
  using (bucket_id = 'clips');
