-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT app_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.app_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.career_assets (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['cover_letter'::text, 'resume_report'::text])),
  title text NOT NULL,
  content jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT career_assets_pkey PRIMARY KEY (id),
  CONSTRAINT career_assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  color text NOT NULL CHECK (color = ANY (ARRAY['blue'::text, 'purple'::text, 'green'::text, 'orange'::text, 'red'::text, 'pink'::text])),
  due_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.deadlines (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  title text NOT NULL,
  due_text text NOT NULL,
  due_at timestamp with time zone,
  priority text NOT NULL CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT deadlines_pkey PRIMARY KEY (id),
  CONSTRAINT deadlines_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id),
  CONSTRAINT deadlines_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.flashcards (
  id uuid NOT NULL,
  study_set_id uuid NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL,
  study_set_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['mcq'::text, 'truefalse'::text, 'fill'::text])),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_study_set_id_fkey FOREIGN KEY (study_set_id) REFERENCES public.study_sets(id)
);
CREATE TABLE public.study_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['flashcards'::text, 'quiz'::text])),
  title text NOT NULL DEFAULT 'Generated set'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT study_sets_pkey PRIMARY KEY (id),
  CONSTRAINT study_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  parent_task_id uuid,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL,
  due_text text,
  due_at timestamp with time zone,
  priority text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  description text,
  category text,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id),
  CONSTRAINT tasks_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id)
);