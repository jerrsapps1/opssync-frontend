create table if not exists org_entitlements (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  branding_enabled boolean not null default false,
  white_label_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create or replace function org_entitlements_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_entitlements_touch on org_entitlements;
create trigger trg_org_entitlements_touch before update on org_entitlements
for each row execute function org_entitlements_touch();
