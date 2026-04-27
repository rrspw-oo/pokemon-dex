create extension if not exists "pgcrypto";

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  have_pokemon_id integer not null,
  have_pokemon_name text not null,
  have_iv_attack smallint,
  have_iv_defense smallint,
  have_iv_stamina smallint,
  have_cp integer,
  have_level numeric(4,1),
  have_shiny boolean default false,
  have_is_variant boolean default false,
  have_form_note text default '',

  want_pokemon_id integer not null,
  want_pokemon_name text not null,
  want_shiny boolean default false,
  want_is_variant boolean default false,
  want_form_note text default '',

  region text not null,
  languages text[] default '{}',
  note text default '',
  status text not null default 'open',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index if not exists listings_status_created_at_idx
  on public.listings (status, created_at desc);

create index if not exists listings_match_idx
  on public.listings (have_pokemon_id, want_pokemon_id, status);

create index if not exists listings_user_idx
  on public.listings (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

alter table public.listings enable row level security;

drop policy if exists "anyone can read open listings" on public.listings;
create policy "anyone can read open listings"
  on public.listings for select
  using (status = 'open' or auth.uid() = user_id);

drop policy if exists "users insert own listings" on public.listings;
create policy "users insert own listings"
  on public.listings for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own listings" on public.listings;
create policy "users update own listings"
  on public.listings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own listings" on public.listings;
create policy "users delete own listings"
  on public.listings for delete
  using (auth.uid() = user_id);
