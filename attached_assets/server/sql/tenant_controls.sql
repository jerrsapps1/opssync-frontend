-- Tenants (organizations)
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

-- Users within tenants and their roles
create table if not exists org_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null, -- reference to your users table id
  email text,            -- optional convenience field for listing
  role text not null check (role in ('OWNER','ADMIN','MANAGER','SUPERVISOR','VIEWER')),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique (tenant_id, user_id)
);

-- Feature overrides per tenant
create table if not exists feature_overrides (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  supervisor boolean,
  manager boolean,
  sla boolean,
  reminders boolean,
  escalations boolean,
  weekly_digest boolean,
  updated_at timestamptz not null default now()
);

create or replace function feature_overrides_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_feature_overrides_touch on feature_overrides;
create trigger trg_feature_overrides_touch before update on feature_overrides
for each row execute function feature_overrides_touch();

-- Notification preferences per tenant
create table if not exists notification_prefs (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  daily_digest boolean not null default false,
  weekly_digest boolean not null default true,
  timezone text default 'America/Chicago',
  escalation_after_hours integer not null default 4,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_notification_prefs_touch on notification_prefs;
create trigger trg_notification_prefs_touch before update on notification_prefs
for each row execute function feature_overrides_touch();
