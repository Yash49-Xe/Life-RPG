-- Migration: 00009_alter_profiles_add_coins
-- Adds a coins balance column to user profiles.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins INT NOT NULL DEFAULT 0;
