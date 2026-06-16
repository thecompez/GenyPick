create extension if not exists pgcrypto;

create table if not exists users (
  wallet_address text primary key,
  fid bigint,
  username text,
  display_name text,
  pfp_url text,
  created_at timestamptz default now()
);

create table if not exists prediction_attempts (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  fid bigint,
  attempt_number int not null,
  champion_id int not null,
  runner_up_id int not null,
  third_place_id int not null,
  fourth_place_id int not null,
  entry_amount numeric not null,
  tx_hash text not null unique,
  active boolean not null default true,
  invalidated_at timestamptz,
  score int,
  exact_match boolean,
  eligible boolean,
  reward_amount numeric,
  submitted_at timestamptz default now(),
  constraint prediction_attempts_card_price check (entry_amount = 256),
  constraint prediction_attempts_unique_wallet_attempt unique (wallet_address, attempt_number),
  constraint prediction_attempts_team_range check (
    champion_id between 1 and 48 and
    runner_up_id between 1 and 48 and
    third_place_id between 1 and 48 and
    fourth_place_id between 1 and 48
  ),
  constraint prediction_attempts_unique_teams check (
    champion_id <> runner_up_id and
    champion_id <> third_place_id and
    champion_id <> fourth_place_id and
    runner_up_id <> third_place_id and
    runner_up_id <> fourth_place_id and
    third_place_id <> fourth_place_id
  )
);

alter table prediction_attempts add column if not exists exact_match boolean;
alter table prediction_attempts add column if not exists reward_amount numeric;

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists final_results (
  id int primary key default 1,
  champion_id int not null,
  runner_up_id int not null,
  third_place_id int not null,
  fourth_place_id int not null,
  created_at timestamptz default now(),
  constraint final_results_singleton check (id = 1),
  constraint final_results_team_range check (
    champion_id between 1 and 48 and
    runner_up_id between 1 and 48 and
    third_place_id between 1 and 48 and
    fourth_place_id between 1 and 48
  ),
  constraint final_results_unique_teams check (
    champion_id <> runner_up_id and
    champion_id <> third_place_id and
    champion_id <> fourth_place_id and
    runner_up_id <> third_place_id and
    runner_up_id <> fourth_place_id and
    third_place_id <> fourth_place_id
  )
);

create unique index if not exists prediction_attempts_one_active_wallet_idx
  on prediction_attempts (lower(wallet_address))
  where active;

create index if not exists prediction_attempts_score_idx
  on prediction_attempts (exact_match desc nulls last, score desc nulls last, submitted_at asc)
  where active;

create index if not exists prediction_attempts_wallet_idx
  on prediction_attempts (lower(wallet_address), attempt_number desc);

create index if not exists prediction_attempts_fid_idx on prediction_attempts (fid);
