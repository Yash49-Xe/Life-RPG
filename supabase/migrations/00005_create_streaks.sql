-- Migration: 00005_create_streaks

CREATE TABLE public.streaks (
  user_id             UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category            TEXT    NOT NULL,
  current_streak      INT     NOT NULL DEFAULT 0,
  last_completed_date DATE,
  freeze_available    BOOLEAN NOT NULL DEFAULT FALSE,

  PRIMARY KEY (user_id, category)
);

CREATE INDEX streaks_user_id_idx ON public.streaks (user_id);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own streaks"
  ON public.streaks FOR ALL USING (auth.uid() = user_id);
