import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { xpForCategory, computeLevelUp } from "@/lib/leveling";
import { updateStreak } from "@/lib/streaks";
import { buildingXpForCategory, streakBonusXp, CATEGORY_BUILDING } from "@/lib/buildings";
import { coinsPerCompletion } from "@/lib/coins";
import type { Task, Character, Building, Profile } from "@/types/database.types";

const RATE_LIMIT_ACTION = "task_complete";
const RATE_LIMIT_MAX    = 20;
const RATE_LIMIT_WINDOW = 3600;

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/tasks/[id]/complete
 *
 * Full completion pipeline (all server-side):
 *  1. Auth check
 *  2. Rate limit (20/hr)
 *  3. Validate task ownership + pending status
 *  4. Mark complete (server timestamp)
 *  5. Update character XP + level
 *  6. Update streak for task category
 *  7. Award building XP (base + streak bonus) → may set building status='ready'
 *  8. Award coins (streak-boosted)
 */
export async function POST(_request: NextRequest, { params }: Params) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // ── 2. Rate limit ─────────────────────────────────────────────────────────────
  const rateLimit = await checkRateLimit(user.id, RATE_LIMIT_ACTION, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
  if (!rateLimit.allowed) {
    return err(
      `Rate limit exceeded. Max ${RATE_LIMIT_MAX} completions/hour. Resets at ${rateLimit.resetAt.toISOString()}`,
      429
    );
  }

  const { id } = await params;

  // ── 3. Fetch task (RLS enforces ownership) ────────────────────────────────────
  const { data: task } = await (supabase
    .from("tasks").select("*").eq("id", id)
    .single() as unknown as QueryResult<Task>);
  if (!task) return err("Task not found", 404);

  if (task.status !== "pending") {
    return err(`Task is already '${task.status}' and cannot be completed`, 409);
  }

  // ── 4. Mark task complete (server timestamp) ──────────────────────────────────
  const { data: updatedTask, error: updateError } = await (supabase
    .from("tasks")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id).select().single() as unknown as QueryResult<Task>);
  if (updateError || !updatedTask) return err("Failed to complete task", 500);

  // ── 5. Character XP + level-up ────────────────────────────────────────────────
  const { data: character } = await (supabase
    .from("character").select("*").eq("user_id", user.id)
    .single() as unknown as QueryResult<Character>);
  if (!character) return err("Character not found", 500);

  const xpAwarded = xpForCategory(task.category);
  const { newLevel, newXp, leveledUp, levelsGained } = computeLevelUp(character.level, character.xp, xpAwarded);

  const { data: updatedCharacter } = await (supabase
    .from("character")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({ level: newLevel, xp: newXp })
    .eq("user_id", user.id).select().single() as unknown as QueryResult<Character>);

  // ── 6. Update streak ──────────────────────────────────────────────────────────
  const streak = await updateStreak(supabase, user.id, task.category);

  // ── 7. Award building XP ──────────────────────────────────────────────────────
  let buildingResult: Building | null = null;
  let buildingBecameReady = false;
  const buildingType = CATEGORY_BUILDING[task.category.toLowerCase()];

  if (buildingType) {
    const { data: building } = await (supabase
      .from("buildings").select("*")
      .eq("user_id", user.id).eq("type", buildingType)
      .maybeSingle() as unknown as QueryResult<Building>);

    if (building && building.status !== "upgrading") {
      const baseXp   = buildingXpForCategory(task.category);
      const bonusXp  = building.streak_bonus_active ? streakBonusXp(streak.current_streak) : 0;
      const newBuildingXp = building.current_xp + baseXp + bonusXp;
      buildingBecameReady = newBuildingXp >= building.xp_required_next && building.status === "idle";

      const { data: updatedBuilding } = await (supabase
        .from("buildings")
        // @ts-ignore — Supabase Update type infers 'never' with strict generics
        .update({
          current_xp:          newBuildingXp,
          status:              buildingBecameReady ? "ready" : building.status,
          streak_bonus_active: streak.current_streak >= 3,
        })
        .eq("id", building.id).select().single() as unknown as QueryResult<Building>);

      buildingResult = updatedBuilding;
    }
  }

  // ── 8. Award coins ────────────────────────────────────────────────────────────
  const { data: profile } = await (supabase
    .from("profiles").select("coins").eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);

  const coinsEarned = coinsPerCompletion(streak.current_streak);
  const newCoins    = (profile?.coins ?? 0) + coinsEarned;

  await (supabase.from("profiles")
    // @ts-ignore
    .update({ coins: newCoins }).eq("id", user.id));

  return ok({
    task:                 updatedTask,
    character:            updatedCharacter,
    xpAwarded,
    leveledUp,
    levelsGained,
    streak,
    building:             buildingResult,
    buildingBecameReady,
    coinsEarned,
    totalCoins:           newCoins,
    rateLimitRemaining:   rateLimit.remaining,
  });
}
