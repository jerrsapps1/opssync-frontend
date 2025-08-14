create table if not exists org_branding (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  logo_url text,
  primary_color text,
  accent_color text,
  company_name text,
  updated_at timestamptz not null default now()
);

create or replace function org_branding_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_branding_touch on org_branding;
create trigger trg_org_branding_touch before update on org_branding
for each row execute function org_branding_touch();
