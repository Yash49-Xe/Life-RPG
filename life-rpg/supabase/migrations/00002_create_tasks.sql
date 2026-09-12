-- Migration: 00002_create_tasks

CREATE TABLE public.tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category     TEXT        NOT NULL,
  title        TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'completed', 'failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX tasks_user_id_idx  ON public.tasks (user_id);
CREATE INDEX tasks_category_idx ON public.tasks (user_id, category);
CREATE INDEX tasks_status_idx   ON public.tasks (user_id, status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON public.tasks FOR ALL USING (auth.uid() = user_id);
