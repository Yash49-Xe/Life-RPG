-- Migration: 00010_alter_buildings_add_category_and_ready
-- Adds linked_category column and 'ready' status to buildings.

-- Add linked_category (which task category feeds XP to this building)
ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS linked_category TEXT NOT NULL DEFAULT 'general';

-- Extend status to include 'ready' (enough XP accumulated, awaiting upgrade start)
ALTER TABLE public.buildings
  DROP CONSTRAINT IF EXISTS buildings_status_check;

ALTER TABLE public.buildings
  ADD CONSTRAINT buildings_status_check
    CHECK (status IN ('idle', 'ready', 'upgrading'));
