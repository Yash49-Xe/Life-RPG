// TypeScript types for the Life RPG Supabase schema.
// Regenerate with: npx supabase gen types typescript --project-id <id> > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Domain types ──────────────────────────────────────────────────────────────

export interface CharacterAttributes {
  strength:     number;
  intelligence: number;
  endurance:    number;
  creativity:   number;
  [key: string]: number;
}

export type TaskStatus          = "pending" | "completed" | "failed";
export type VerificationType    = "none" | "timer" | "photo" | "gps";
export type VerificationStatus  = "unverified" | "pending" | "verified" | "flagged";
export type BuildingStatus      = "idle" | "ready" | "upgrading";
export type DailyQuestStatus    = "pending" | "completed" | "expired";
export type BuildingType        = "gym" | "library" | "office" | "studio" | string;

// ── Table row types ───────────────────────────────────────────────────────────

export interface Profile {
  id:            string;
  email:         string;
  coins:         number;
  created_at:    string;
  gym_latitude?: number | null;
  gym_longitude?: number | null;
  gym_name?:     string | null;
}

export interface Task {
  id:                   string;
  user_id:              string;
  category:             string;
  title:                string;
  status:               TaskStatus;
  started_at?:          string | null;
  min_duration_seconds?: number;
  verification_type?:    VerificationType;
  verification_status?:  VerificationStatus;
  verification_details?: Json;
  created_at:           string;
  completed_at:         string | null;
}

export interface Character {
  user_id:    string;
  level:      number;
  xp:         number;
  attributes: CharacterAttributes;
}

export interface Building {
  id:                  string;
  user_id:             string;
  type:                BuildingType;
  linked_category:     string;
  level:               number;
  current_xp:          number;
  xp_required_next:    number;
  status:              BuildingStatus;
  upgrade_started_at:  string | null;
  upgrade_complete_at: string | null;
  streak_bonus_active: boolean;
}

export interface Streak {
  user_id:             string;
  category:            string;
  current_streak:      number;
  last_completed_date: string | null; // "YYYY-MM-DD"
  freeze_available:    boolean;
}

export interface DailyQuest {
  id:            string;
  user_id:       string;
  task_template: string;
  assigned_date: string; // "YYYY-MM-DD"
  status:        DailyQuestStatus;
  bonus_xp:      number;
}

export interface Guild {
  id:         string;
  name:       string;
  join_code:  string;
  created_by: string;
  created_at: string;
}

export interface GuildMember {
  guild_id:  string;
  user_id:   string;
  joined_at: string;
}

export interface RateLimit {
  user_id:      string;
  action:       string;
  window_start: string; // ISO 8601 timestamp
  count:        number;
}

// ── Supabase Database shape ───────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    Profile;
        Insert: Omit<Profile, "created_at" | "coins"> & { created_at?: string; coins?: number };
        Update: Partial<Omit<Profile, "id">>;
      };
      tasks: {
        Row:    Task;
        Insert: Omit<Task, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Task, "id" | "user_id">>;
      };
      character: {
        Row:    Character;
        Insert: Omit<Character, "level" | "xp"> & { level?: number; xp?: number };
        Update: Partial<Omit<Character, "user_id">>;
      };
      buildings: {
        Row:    Building;
        Insert: Omit<Building, "id"> & { id?: string };
        Update: Partial<Omit<Building, "id" | "user_id">>;
      };
      streaks: {
        Row:    Streak;
        Insert: Streak;
        Update: Partial<Omit<Streak, "user_id" | "category">>;
      };
      daily_quests: {
        Row:    DailyQuest;
        Insert: Omit<DailyQuest, "id"> & { id?: string };
        Update: Partial<Omit<DailyQuest, "id" | "user_id">>;
      };
      guilds: {
        Row:    Guild;
        Insert: Omit<Guild, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Guild, "id" | "created_by">>;
      };
      guild_members: {
        Row:    GuildMember;
        Insert: Omit<GuildMember, "joined_at"> & { joined_at?: string };
        Update: Partial<Pick<GuildMember, "joined_at">>;
      };
      rate_limits: {
        Row:    RateLimit;
        Insert: RateLimit;
        Update: Partial<Omit<RateLimit, "user_id" | "action">>;
      };
    };
    Views: {
      leaderboard: {
        Row: { user_id: string; display_name: string; level: number; xp: number; rank: number };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      task_status:         TaskStatus;
      building_status:     BuildingStatus;
      daily_quest_status:  DailyQuestStatus;
    };
  };
}
