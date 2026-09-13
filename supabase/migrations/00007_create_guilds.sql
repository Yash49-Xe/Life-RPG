-- Migration: 00007_create_guilds

CREATE TABLE public.guilds (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  join_code  TEXT        NOT NULL UNIQUE,
  created_by UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX guilds_join_code_idx  ON public.guilds (join_code);
CREATE INDEX guilds_created_by_idx ON public.guilds (created_by);

ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view guilds (to join via code)
CREATE POLICY "Authenticated users can view guilds"
  ON public.guilds FOR SELECT USING (auth.role() = 'authenticated');

-- Only the creator can update/delete their guild
CREATE POLICY "Creator can manage guild"
  ON public.guilds FOR ALL USING (auth.uid() = created_by);

-- ─── Guild Members ────────────────────────────────────────────────────────────

CREATE TABLE public.guild_members (
  guild_id  UUID        NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (guild_id, user_id)
);

CREATE INDEX guild_members_user_id_idx  ON public.guild_members (user_id);
CREATE INDEX guild_members_guild_id_idx ON public.guild_members (guild_id);

ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;

-- Members can see all members of guilds they belong to
CREATE POLICY "Guild members can view their guild roster"
  ON public.guild_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.guild_members gm
      WHERE gm.guild_id = guild_members.guild_id
        AND gm.user_id = auth.uid()
    )
  );

-- Users can join/leave (insert/delete their own membership)
CREATE POLICY "Users can manage own guild membership"
  ON public.guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave guild"
  ON public.guild_members FOR DELETE USING (auth.uid() = user_id);
