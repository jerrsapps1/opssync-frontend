create table if not exists org_white_label (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  custom_domain text,
  from_email text,
  domain_dns_status text,
  email_spf_dkim_status text,
  updated_at timestamptz not null default now()
);
create or replace function org_white_label_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_white_label_touch on org_white_label;
create trigger trg_org_white_label_touch before update on org_white_label
for each row execute function org_white_label_touch();
