-- On-device SQLite (expo-sqlite). No server database in v1.
create table if not exists messages (
  id text primary key,                       -- uuid
  role text not null check (role in ('guide','user','system')),
  kind text not null check (kind in ('text','brief','route','stop','map','finish','permission')),
  payload text not null default '{}',        -- json
  route_id text,
  stop_id text,
  created_at text not null                   -- UTC ISO 8601
);
create index if not exists messages_created on messages (created_at);

create table if not exists progress (
  route_id text primary key,
  started_at text,
  current_stop_id text,
  heard_stop_ids text not null default '[]', -- json array
  triggered_stop_ids text not null default '[]',
  distance_walked_m integer not null default 0,
  finished_at text
);

create table if not exists settings (
  key text primary key,                      -- language, playback_speed, autoplay_nearby
  value text not null
);
