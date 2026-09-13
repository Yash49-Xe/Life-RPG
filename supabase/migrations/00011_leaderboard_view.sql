-- Migration: 00011_leaderboard_view
-- Read-only view joining character stats with profile emails.

CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT
    p.id         AS user_id,
    -- Truncate email to "user@..." for privacy
    split_part(p.email, '@', 1) || '@...' AS display_name,
    c.level,
    c.xp,
    ROW_NUMBER() OVER (ORDER BY c.level DESC, c.xp DESC) AS rank
  FROM public.profiles p
  JOIN public.character c ON c.user_id = p.id
  ORDER BY c.level DESC, c.xp DESC;

-- Allow authenticated users to read the leaderboard
GRANT SELECT ON public.leaderboard TO authenticated;
