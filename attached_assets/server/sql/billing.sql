create table if not exists org_subscriptions (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  plan text not null default 'standard',
  status text not null default 'inactive', -- inactive|trialing|active|past_due|po_pending
  po_number text,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

create or replace function org_subscriptions_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_org_subscriptions_touch on org_subscriptions;
create trigger trg_org_subscriptions_touch before update on org_subscriptions
for each row execute function org_subscriptions_touch();
