// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyQuest } from "@/types/database.types";

type ListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

// ── Quest template pool ───────────────────────────────────────────────────────

interface QuestTemplate {
  template: string;
  bonus_xp: number;
}

export const QUEST_TEMPLATES: Record<string, QuestTemplate[]> = {
  fitness: [
    { template: "Complete 1 fitness task today",    bonus_xp: 15 },
    { template: "Log a workout session",             bonus_xp: 20 },
    { template: "Complete 2 fitness tasks in a day", bonus_xp: 30 },
  ],
  study: [
    { template: "Complete 1 study task today",  bonus_xp: 15 },
    { template: "Study or read for 30 minutes", bonus_xp: 20 },
    { template: "Complete 2 study tasks today", bonus_xp: 30 },
  ],
  work: [
    { template: "Finish 1 work task today",        bonus_xp: 15 },
    { template: "Clear your top priority task",    bonus_xp: 20 },
    { template: "Complete 2 work items today",     bonus_xp: 30 },
  ],
  personal: [
    { template: "Complete 1 personal task today",         bonus_xp: 15 },
    { template: "Do something meaningful for yourself",   bonus_xp: 20 },
    { template: "Complete 2 personal tasks today",        bonus_xp: 30 },
  ],
};

const CATEGORIES       = Object.keys(QUEST_TEMPLATES);
const QUESTS_PER_DAY   = 3;

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * Returns today's daily quests for the user.
 * Auto-assigns 3 quests from random categories if none exist yet.
 * Idempotent — safe to call multiple times per day.
 */
export async function getTodayQuests(
  supabase: SupabaseClient<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string
): Promise<DailyQuest[]> {
  const today = todayStr();

  const { data: existing } = await (supabase
    .from("daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("assigned_date", today) as unknown as ListResult<DailyQuest>);

  if (existing && existing.length > 0) return existing;
  return assignDailyQuests(supabase, userId);
}

/**
 * Picks 3 random categories (without repeat), selects 1 random template
 * per category, inserts rows into daily_quests, and returns them.
 */
export async function assignDailyQuests(
  supabase: SupabaseClient<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string
): Promise<DailyQuest[]> {
  const today = todayStr();

  // Shuffle categories and pick QUESTS_PER_DAY
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, QUESTS_PER_DAY);

  const rows = selected.map((category) => {
    const pool = QUEST_TEMPLATES[category];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return {
      user_id:       userId,
      task_template: pick.template,
      assigned_date: today,
      status:        "pending" as const,
      bonus_xp:      pick.bonus_xp,
    };
  });

  const { data } = await (supabase
    .from("daily_quests")
    // @ts-ignore — Supabase Insert type infers 'never' with strict generics
    .insert(rows)
    .select() as unknown as ListResult<DailyQuest>);

  return data ?? [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}
