-- Migration: 00008_create_rate_limits
-- DB-backed rate limiting table (written via service_role only).

CREATE TABLE public.rate_limits (
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action       TEXT        NOT NULL,        -- e.g. 'task_complete'
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count        INT         NOT NULL DEFAULT 1,

  PRIMARY KEY (user_id, action)
);

-- No user-level RLS needed — this table is only ever written
-- from the server using the service_role key (bypasses RLS).
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny all access from anon/authenticated roles; service_role bypasses this.
CREATE POLICY "No direct access"
  ON public.rate_limits FOR ALL
  USING (false);
