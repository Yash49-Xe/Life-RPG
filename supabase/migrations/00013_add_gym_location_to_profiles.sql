-- Migration: 00013_add_gym_location_to_profiles
-- Adds gym location tracking columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gym_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS gym_longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS gym_name TEXT DEFAULT 'My Gym';
