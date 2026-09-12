import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limiter";
import { xpForCategory, computeLevelUp } from "@/lib/leveling";
import { updateStreak } from "@/lib/streaks";
import { buildingXpForCategory, streakBonusXp, CATEGORY_BUILDING } from "@/lib/buildings";
import { coinsPerCompletion } from "@/lib/coins";
import { verifyTimer } from "@/lib/verification/timer";
import { verifyExercisePhoto } from "@/lib/verification/gemini";
import { verifyGpsLocation } from "@/lib/verification/gps";
import type { Task, Character, Building, Profile, VerificationStatus } from "@/types/database.types";

const RATE_LIMIT_ACTION = "task_complete";
const RATE_LIMIT_MAX    = 20;
const RATE_LIMIT_WINDOW = 3600;

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/tasks/[id]/complete
 *
 * Completion & Verification Pipeline (All server-side):
 *  1. Auth check
 *  2. Rate limit (20/hr)
 *  3. Task ownership check
 *  4. Verification evaluation (Study timer, Exercise Gemini photo, Gym GPS)
 *     - If Study timer requirement unmet -> Return 400 Bad Request
 *     - If Exercise photo fails Gemini / missing / timeout -> Set 'flagged' & grant 50% partial XP
 *     - If Gym GPS fails/missing -> Set 'flagged' & grant 50% partial XP
 *  5. Mark complete with verification_status & details
 *  6. Award character XP (scaled by verification status) + level-up
 *  7. Update streak
 *  8. Award building XP
 *  9. Award coins
 */
export async function POST(request: NextRequest, { params }: Params) {
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

  // ── Parse request body optional parameters ───────────────────────────────────
  let photoData: string | undefined;
  let mimeType: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;
  let accuracy: number | undefined;

  try {
    const body = await request.json().catch(() => ({}));
    photoData = body.photoData;
    mimeType = body.mimeType;
    latitude = body.latitude;
    longitude = body.longitude;
    accuracy = body.accuracy;
  } catch {
    // Body optional
  }

  // ── 3. Fetch task (RLS enforces ownership) ────────────────────────────────────
  const { data: task } = await (supabase
    .from("tasks").select("*").eq("id", id)
    .single() as unknown as QueryResult<Task>);
  if (!task) return err("Task not found", 404);

  if (task.status !== "pending") {
    return err(`Task is already '${task.status}' and cannot be completed`, 409);
  }

  // ── 4. Perform Category/Type Verification ────────────────────────────────────
  const categoryLower = task.category.toLowerCase();
  let vType = task.verification_type || "none";

  // Auto-detect verification type from category if set to 'none'
  if (vType === "none") {
    if (categoryLower === "study" || categoryLower === "focus") {
      vType = "timer";
    } else if (categoryLower === "exercise" || categoryLower === "workout") {
      vType = "photo";
    } else if (categoryLower === "gym" || categoryLower === "fitness") {
      vType = "gps";
    }
  }

  let verificationStatus: VerificationStatus = "verified";
  let isPartialXp = false;
  let verificationReason = "Task completed";
  const verificationDetailsRecord: Record<string, unknown> = {};

  if (vType === "timer") {
    // Timer check (Study / Focus)
    const minSec = task.min_duration_seconds ?? 60;
    const timerRes = verifyTimer(task.started_at, minSec);
    
    if (!timerRes.valid) {
      // For study timer, strict minimum elapsed duration is required
      return err(timerRes.reason, 400);
    }
    
    verificationStatus = "verified";
    verificationReason = timerRes.reason;
    verificationDetailsRecord.timer = {
      elapsedSeconds: timerRes.elapsedSeconds,
      minRequiredSeconds: timerRes.minRequiredSeconds,
    };
  } else if (vType === "photo") {
    // Photo check (Exercise)
    if (!photoData) {
      verificationStatus = "flagged";
      isPartialXp = true;
      verificationReason = "No exercise photo provided — flagged for partial XP";
      verificationDetailsRecord.photo = { provided: false };
    } else {
      const geminiRes = await verifyExercisePhoto(photoData, mimeType || "image/jpeg");
      if (geminiRes.verified) {
        verificationStatus = "verified";
        verificationReason = geminiRes.reason;
      } else {
        // Reject or fallback: set flagged & partial XP
        verificationStatus = "flagged";
        isPartialXp = true;
        verificationReason = geminiRes.reason;
      }
      verificationDetailsRecord.gemini = {
        success: geminiRes.success,
        confidence: geminiRes.confidence,
        reason: geminiRes.reason,
        isFallback: geminiRes.isFallback,
      };
    }
  } else if (vType === "gps") {
    // GPS check (Gym)
    const gpsRes = verifyGpsLocation(latitude, longitude, accuracy);
    if (gpsRes.valid) {
      verificationStatus = "verified";
      verificationReason = gpsRes.reason;
    } else {
      // Invalid GPS -> flag for partial XP
      verificationStatus = "flagged";
      isPartialXp = true;
      verificationReason = gpsRes.reason;
    }
    verificationDetailsRecord.gps = {
      valid: gpsRes.valid,
      reason: gpsRes.reason,
      details: gpsRes.details,
    };
  }

  // ── 5. Mark task complete ────────────────────────────────────────────────────
  const completedAt = new Date().toISOString();
  const { data: updatedTask, error: updateError } = await (supabase
    .from("tasks")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({
      status: "completed",
      completed_at: completedAt,
      verification_type: vType,
      verification_status: verificationStatus,
      verification_details: verificationDetailsRecord,
    })
    .eq("id", id).select().single() as unknown as QueryResult<Task>);

  if (updateError || !updatedTask) return err("Failed to complete task", 500);

  // ── 6. Character XP + level-up ────────────────────────────────────────────────
  const { data: character } = await (supabase
    .from("character").select("*").eq("user_id", user.id)
    .single() as unknown as QueryResult<Character>);
  if (!character) return err("Character not found", 500);

  const baseXp = xpForCategory(task.category);
  const xpMultiplier = isPartialXp ? 0.5 : 1.0;
  const xpAwarded = Math.floor(baseXp * xpMultiplier);

  const { newLevel, newXp, leveledUp, levelsGained } = computeLevelUp(character.level, character.xp, xpAwarded);

  const { data: updatedCharacter } = await (supabase
    .from("character")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({ level: newLevel, xp: newXp })
    .eq("user_id", user.id).select().single() as unknown as QueryResult<Character>);

  // ── 7. Update streak ──────────────────────────────────────────────────────────
  const streak = await updateStreak(supabase, user.id, task.category);

  // ── 8. Award building XP ──────────────────────────────────────────────────────
  let buildingResult: Building | null = null;
  let buildingBecameReady = false;
  const buildingType = CATEGORY_BUILDING[task.category.toLowerCase()];

  if (buildingType) {
    const { data: building } = await (supabase
      .from("buildings").select("*")
      .eq("user_id", user.id).eq("type", buildingType)
      .maybeSingle() as unknown as QueryResult<Building>);

    if (building && building.status !== "upgrading") {
      const baseBuildingXp = buildingXpForCategory(task.category);
      const bonusXp  = building.streak_bonus_active ? streakBonusXp(streak.current_streak) : 0;
      const buildingXpAwarded = Math.floor((baseBuildingXp + bonusXp) * xpMultiplier);
      const newBuildingXp = building.current_xp + buildingXpAwarded;
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

  // ── 9. Award coins ────────────────────────────────────────────────────────────
  const { data: profile } = await (supabase
    .from("profiles").select("coins").eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);

  const coinsEarned = Math.floor(coinsPerCompletion(streak.current_streak) * (isPartialXp ? 0.5 : 1.0));
  const newCoins    = (profile?.coins ?? 0) + coinsEarned;

  await (supabase.from("profiles")
    // @ts-ignore
    .update({ coins: newCoins }).eq("id", user.id));

  return ok({
    task:                 updatedTask,
    character:            updatedCharacter,
    verification: {
      type:               vType,
      status:             verificationStatus,
      isPartialXp,
      reason:             verificationReason,
    },
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
