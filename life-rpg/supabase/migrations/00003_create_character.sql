-- Migration: 00003_create_character

CREATE TABLE public.character (
  user_id    UUID  PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  level      INT   NOT NULL DEFAULT 1,
  xp         INT   NOT NULL DEFAULT 0,
  -- JSON shape: { "strength": 1, "intelligence": 1, "endurance": 1, "creativity": 1 }
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.character ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own character"
  ON public.character FOR ALL USING (auth.uid() = user_id);

-- Auto-create character row when a profile is inserted
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.character (user_id, attributes)
  VALUES (
    NEW.id,
    '{"strength": 1, "intelligence": 1, "endurance": 1, "creativity": 1}'::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_profile();
