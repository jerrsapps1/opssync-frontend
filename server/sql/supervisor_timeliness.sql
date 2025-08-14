-- Projects table (minimal fields for demo; integrate with your existing schema)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_blocked boolean not null default true,
  supervisor_email text,
  supervisor_phone text,
  created_at timestamptz not null default now()
);

-- Timeliness items (updates & change requests)
create table if not exists timeliness_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null check (type in ('UPDATE','CHANGE_REQUEST')),
  title text not null,
  description text default '',
  due_at timestamptz not null,
  submitted_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Pre-start checklists (as JSON)
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);
