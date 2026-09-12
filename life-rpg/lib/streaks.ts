// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Streak } from "@/types/database.types";

type MaybeSingle<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * Updates the streak record for a user + category after a task completion.
 *
 * Rules:
 * - If last_completed_date === today:   no change (already counted)
 * - If last_completed_date === yesterday: increment streak
 * - If gap > 1 day AND freeze_available:  preserve streak, consume freeze
 * - Otherwise:                            reset to 1
 *
 * The freeze flag preserves the streak for one missed day without resetting.
 */
export async function updateStreak(
  supabase: SupabaseClient<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  category: string
): Promise<Streak> {
  const today     = todayStr();
  const yesterday = yesterdayStr();

  // Fetch existing streak row
  const { data: existing } = await (supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .maybeSingle() as unknown as MaybeSingle<Streak>);

  // Already tracked today — return unchanged
  if (existing?.last_completed_date === today) return existing;

  let newStreak         = 1;
  let freezeAvailable   = false;
  const completedDate   = today;

  if (existing) {
    const last = existing.last_completed_date;
    if (last === yesterday) {
      // Consecutive day — extend streak
      newStreak       = existing.current_streak + 1;
      freezeAvailable = existing.freeze_available;
    } else if (existing.freeze_available) {
      // Gap but freeze available — preserve streak, consume freeze
      newStreak       = existing.current_streak;
      freezeAvailable = false;
    }
    // else: reset to 1 (defaults already set)
  }

  const payload = {
    user_id:             userId,
    category,
    current_streak:      newStreak,
    last_completed_date: completedDate,
    freeze_available:    freezeAvailable,
  };

  const { data: upserted } = await (supabase
    .from("streaks")
    // @ts-ignore — Supabase upsert type infers 'never' with strict generics
    .upsert(payload, { onConflict: "user_id,category" })
    .select()
    .single() as unknown as MaybeSingle<Streak>);

  return upserted ?? { ...payload };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  return new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
}
