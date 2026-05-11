-- Profili utente (estende auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  is_premium  boolean default false,
  created_at  timestamptz default now()
);

-- Cani
create table if not exists public.dogs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  nome       text not null,
  razza      text,
  eta        text,
  sesso      text check (sesso in ('M', 'F')),
  created_at timestamptz default now()
);

-- Vaccini
create table if not exists public.vaccines (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid references public.dogs(id) on delete cascade not null,
  nome        text not null,
  data_scad   date not null,
  completato  boolean default false,
  created_at  timestamptz default now()
);

-- Diario salute
create table if not exists public.diary_entries (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid references public.dogs(id) on delete cascade not null,
  tipo       text not null,
  titolo     text not null,
  note       text,
  data       date default current_date,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles      enable row level security;
alter table public.dogs          enable row level security;
alter table public.vaccines      enable row level security;
alter table public.diary_entries enable row level security;

-- Policy (drop + recreate per idempotenza)
drop policy if exists "own profile"  on public.profiles;
drop policy if exists "own dogs"     on public.dogs;
drop policy if exists "own vaccines" on public.vaccines;
drop policy if exists "own diary"    on public.diary_entries;

create policy "own profile"  on public.profiles      for all using (auth.uid() = id);
create policy "own dogs"     on public.dogs          for all using (auth.uid() = user_id);
create policy "own vaccines" on public.vaccines      for all using (
  auth.uid() = (select user_id from public.dogs where id = dog_id)
);
create policy "own diary"    on public.diary_entries for all using (
  auth.uid() = (select user_id from public.dogs where id = dog_id)
);

-- Trigger: crea profilo automaticamente dopo signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
