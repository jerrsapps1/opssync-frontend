-- Add columns for manager/owner on projects (nullable; safe to add)
alter table if exists projects
  add column if not exists manager_email text,
  add column if not exists owner_email text;

-- SLA policies per project
create table if not exists sla_policies (
  project_id uuid primary key references projects(id) on delete cascade,
  at_risk_minutes integer not null default 60,
  red_minutes integer not null default 120,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function sla_policies_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_sla_policies_touch on sla_policies;
create trigger trg_sla_policies_touch before update on sla_policies
for each row execute function sla_policies_touch_updated_at();
