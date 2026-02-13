create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists app_users_username_unique_ci
  on app_users (lower(username));

create table if not exists app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  code text not null,
  name text not null,
  color text not null check (color in ('blue', 'purple', 'green', 'orange', 'red', 'pink')),
  due_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_user_id_idx on courses(user_id);

create table if not exists tasks (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  parent_task_id uuid null references tasks(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null,
  due_text text null,
  due_at timestamptz null,
  priority text null check (priority in ('low', 'medium', 'high')),
  description text null,
  category text null
);

create index if not exists tasks_user_course_idx on tasks(user_id, course_id);
create index if not exists tasks_user_parent_idx on tasks(user_id, parent_task_id);
create index if not exists tasks_user_due_at_idx on tasks(user_id, due_at);

create table if not exists deadlines (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  due_text text not null,
  due_at timestamptz null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  description text null,
  created_at timestamptz not null default now()
);

create index if not exists deadlines_user_course_idx on deadlines(user_id, course_id);
create index if not exists deadlines_user_due_at_idx on deadlines(user_id, due_at);

create table if not exists study_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  kind text not null check (kind in ('flashcards', 'quiz')),
  title text not null default 'Generated set',
  created_at timestamptz not null default now()
);

create index if not exists study_sets_user_kind_created_idx on study_sets(user_id, kind, created_at desc);

create table if not exists flashcards (
  id uuid primary key,
  study_set_id uuid not null references study_sets(id) on delete cascade,
  front text not null,
  back text not null,
  position int not null default 0
);

create index if not exists flashcards_study_set_position_idx on flashcards(study_set_id, position);

create table if not exists quiz_questions (
  id uuid primary key,
  study_set_id uuid not null references study_sets(id) on delete cascade,
  type text not null check (type in ('mcq', 'truefalse', 'fill')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  answer text not null,
  position int not null default 0
);

create index if not exists quiz_questions_study_set_position_idx on quiz_questions(study_set_id, position);

create table if not exists career_assets (
  id uuid primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  type text not null check (type in ('cover_letter', 'resume_report')),
  title text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists career_assets_user_type_created_idx on career_assets(user_id, type, created_at desc);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists courses_set_updated_at on courses;
create trigger courses_set_updated_at
before update on courses
for each row execute function set_updated_at();
