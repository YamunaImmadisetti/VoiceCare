-- CareVoice: log of doses taken. Run once in Supabase → SQL Editor.
create table if not exists public.medication_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  log_date      date not null,                    -- user's local calendar day
  taken_at      timestamptz not null default now(),
  unique (medication_id, log_date)                -- one "taken" per medicine per day
);

create index if not exists medication_logs_user_date_idx
  on public.medication_logs (user_id, log_date);

alter table public.medication_logs enable row level security;

-- Separate policies per operation (FOR ALL does not cover INSERT properly)
create policy "logs_select_own" on public.medication_logs
  for select using (auth.uid() = user_id);

create policy "logs_insert_own" on public.medication_logs
  for insert with check (auth.uid() = user_id);

create policy "logs_update_own" on public.medication_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "logs_delete_own" on public.medication_logs
  for delete using (auth.uid() = user_id);

-- Make the API see the new table right away
notify pgrst, 'reload schema';
