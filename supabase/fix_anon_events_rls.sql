-- Run in Supabase SQL Editor for the project in device/config.json
-- Fixes: new row violates row-level security policy for table "events"

-- Ensure Pi device row exists (FK target for events)
insert into public.devices (id, name, audio_source)
values ('pi-cabin-1', 'Raspberry Pi 3B+', 'cabin_mic')
on conflict (id) do update
set name = excluded.name,
    last_seen = now();

-- Allow device uploads with the public anon key
drop policy if exists "anon insert events" on public.events;
create policy "anon insert events"
  on public.events for insert to anon
  with check (true);

drop policy if exists "anon read events" on public.events;
create policy "anon read events"
  on public.events for select to anon
  using (true);

-- Clips storage (safe to re-run)
insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do nothing;

drop policy if exists "anon upload clips" on storage.objects;
create policy "anon upload clips"
  on storage.objects for insert to anon
  with check (bucket_id = 'clips');

drop policy if exists "anon update clips" on storage.objects;
create policy "anon update clips"
  on storage.objects for update to anon
  using (bucket_id = 'clips');

drop policy if exists "anon read clips" on storage.objects;
create policy "anon read clips"
  on storage.objects for select to anon
  using (bucket_id = 'clips');
