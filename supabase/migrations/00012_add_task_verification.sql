-- Migration: 00012_add_task_verification

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS min_duration_seconds INT DEFAULT 60,
  ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_details JSONB DEFAULT '{}'::jsonb;

-- Add check constraints if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_verification_type_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_verification_type_check
      CHECK (verification_type IN ('none', 'timer', 'photo', 'gps'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_verification_status_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_verification_status_check
      CHECK (verification_status IN ('unverified', 'pending', 'verified', 'flagged'));
  END IF;
END $$;
