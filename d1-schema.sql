create table if not exists projects (
  id text primary key,
  name text not null,
  description text,
  meta text,
  owner_id text,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

create table if not exists truths (
  id text primary key,
  project_id text not null,
  status text not null,
  content text not null,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

create table if not exists truth_snapshots (
  id text primary key,
  project_id text not null,
  truth_id text not null,
  version integer not null,
  content text not null,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists roles (
  id text primary key,
  project_id text not null,
  truth_snapshot_id text not null,
  name text not null,
  summary text,
  meta text,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists issues (
  id text primary key,
  project_id text not null,
  truth_snapshot_id text not null,
  type text not null,
  severity text not null,
  title text not null,
  description text,
  refs text,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists module_documents (
  id text primary key,
  project_id text not null,
  module text not null,
  content text not null,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

create table if not exists users (
  id text primary key,
  username text not null,
  password_hash text not null,
  password_salt text not null,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);

create table if not exists sessions (
  id text primary key,
  user_id text not null,
  token text not null,
  expires_at text not null,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists ai_request_logs (
  id text primary key,
  project_id text not null,
  truth_snapshot_id text,
  action_type text not null,
  provider text not null,
  model text,
  meta text,
  created_at text not null default CURRENT_TIMESTAMP
);

create table if not exists feedback (
  id text primary key,
  project_id text not null,
  content text not null,
  type text,
  meta text,
  created_at text not null default CURRENT_TIMESTAMP
);

-- add meta for existing databases (run once if missing)
alter table projects add column meta text;
