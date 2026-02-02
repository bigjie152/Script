create table if not exists projects (
  id text primary key,
  name text not null,
  description text,
  status text,
  meta text,
  cover text,
  tags text,
  genre text,
  players text,
  duration text,
  difficulty text,
  owner_id text,
  is_public integer not null default 0,
  published_at text,
  community_summary text,
  ai_status text,
  deleted_at text,
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
  needs_review integer not null default 0,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);
create table if not exists truth_unlock_logs (
  id text primary key,
  project_id text not null,
  reason text not null,
  unlocked_by text not null,
  unlocked_at text not null
);
create table if not exists impact_reports (
  id text primary key,
  project_id text not null,
  truth_snapshot_id text,
  affected_items text not null,
  created_at text not null default CURRENT_TIMESTAMP
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
create table if not exists ratings (
  id text primary key,
  project_id text not null,
  user_id text not null,
  score integer not null,
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);
create unique index if not exists ratings_project_user_idx
  on ratings (project_id, user_id);
create table if not exists comments (
  id text primary key,
  project_id text not null,
  user_id text not null,
  parent_id text,
  content text not null,
  is_suggestion integer not null default 0,
  status text not null default 'normal',
  created_at text not null default CURRENT_TIMESTAMP,
  updated_at text not null default CURRENT_TIMESTAMP
);
create index if not exists comments_project_idx
  on comments (project_id, created_at);
create table if not exists favorites (
  id text primary key,
  project_id text not null,
  user_id text not null,
  created_at text not null default CURRENT_TIMESTAMP
);
create unique index if not exists favorites_project_user_idx
  on favorites (project_id, user_id);
create table if not exists likes (
  id text primary key,
  project_id text not null,
  user_id text not null,
  created_at text not null default CURRENT_TIMESTAMP
);
create unique index if not exists likes_project_user_idx
  on likes (project_id, user_id);
create table if not exists notifications (
  id text primary key,
  user_id text not null,
  type text not null,
  payload text,
  is_read integer not null default 0,
  created_at text not null default CURRENT_TIMESTAMP
);
-- add new columns for existing databases (run once if missing)
alter table projects add column if not exists is_public integer;
alter table projects add column if not exists published_at text;
alter table projects add column if not exists community_summary text;
alter table projects add column if not exists ai_status text;
alter table projects add column if not exists status text;
alter table projects add column if not exists cover text;
alter table projects add column if not exists tags text;
alter table projects add column if not exists genre text;
alter table projects add column if not exists players text;
alter table projects add column if not exists duration text;
alter table projects add column if not exists difficulty text;
alter table projects add column if not exists deleted_at text;
alter table module_documents add column if not exists needs_review integer;
