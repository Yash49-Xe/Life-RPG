-- Migration: 00004_create_buildings

CREATE TABLE public.buildings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type                TEXT        NOT NULL,   -- 'gym' | 'library' | 'office' | 'studio'
  level               INT         NOT NULL DEFAULT 1,
  current_xp          INT         NOT NULL DEFAULT 0,
  xp_required_next    INT         NOT NULL DEFAULT 100,
  status              TEXT        NOT NULL DEFAULT 'idle'
                                  CHECK (status IN ('idle', 'upgrading')),
  upgrade_started_at  TIMESTAMPTZ,
  upgrade_complete_at TIMESTAMPTZ,
  streak_bonus_active BOOLEAN     NOT NULL DEFAULT FALSE,

  CONSTRAINT buildings_user_type_unique UNIQUE (user_id, type)
);

CREATE INDEX buildings_user_id_idx ON public.buildings (user_id);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own buildings"
  ON public.buildings FOR ALL USING (auth.uid() = user_id);
