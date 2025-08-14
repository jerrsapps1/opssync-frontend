-- Global (platform) feature overrides (owner-controlled)
create table if not exists global_features (
  key text primary key,
  value boolean not null,
  updated_at timestamptz not null default now()
);

create or replace function global_features_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_global_features_touch on global_features;
create trigger trg_global_features_touch before update on global_features
for each row execute function global_features_touch();
