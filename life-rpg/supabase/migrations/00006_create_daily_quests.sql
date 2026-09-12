-- Migration: 00006_create_daily_quests

CREATE TABLE public.daily_quests (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Template text for the quest (e.g. "Complete 3 fitness tasks")
  task_template TEXT        NOT NULL,
  assigned_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'completed', 'expired')),
  bonus_xp      INT         NOT NULL DEFAULT 0,

  -- One quest per template per user per day
  CONSTRAINT daily_quests_user_date_template_unique UNIQUE (user_id, assigned_date, task_template)
);

CREATE INDEX daily_quests_user_id_idx   ON public.daily_quests (user_id);
CREATE INDEX daily_quests_date_idx      ON public.daily_quests (user_id, assigned_date);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily quests"
  ON public.daily_quests FOR ALL USING (auth.uid() = user_id);
