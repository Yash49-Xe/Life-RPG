import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { computeLevelUp } from "@/lib/leveling";
import type { DailyQuest, Character } from "@/types/database.types";

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/quests/[id]/complete
 *
 * Marks a daily quest as completed and awards its bonus_xp to the character.
 * Guards:
 *  1. Auth
 *  2. Quest must belong to user and be 'pending'
 *  3. Quest must be assigned for today (expired quests cannot be completed)
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;
  const today  = new Date().toISOString().split("T")[0];

  // Fetch quest (RLS ensures ownership)
  const { data: quest } = await (supabase
    .from("daily_quests")
    .select("*")
    .eq("id", id)
    .single() as unknown as QueryResult<DailyQuest>);

  if (!quest) return err("Quest not found", 404);

  if (quest.status !== "pending") {
    return err(`Quest is already '${quest.status}'`, 409);
  }

  if (quest.assigned_date !== today) {
    return err("This quest expired — it was assigned on a previous day.", 410);
  }

  // Mark complete
  const { data: completedQuest } = await (supabase
    .from("daily_quests")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({ status: "completed" })
    .eq("id", id)
    .select()
    .single() as unknown as QueryResult<DailyQuest>);

  // Award bonus XP to character
  const { data: character } = await (supabase
    .from("character")
    .select("*")
    .eq("user_id", user.id)
    .single() as unknown as QueryResult<Character>);

  if (!character) return err("Character not found", 500);

  const { newLevel, newXp, leveledUp, levelsGained } = computeLevelUp(
    character.level, character.xp, quest.bonus_xp
  );

  const { data: updatedCharacter } = await (supabase
    .from("character")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({ level: newLevel, xp: newXp })
    .eq("user_id", user.id)
    .select()
    .single() as unknown as QueryResult<Character>);

  return ok({
    quest:            completedQuest,
    character:        updatedCharacter,
    bonusXpAwarded:   quest.bonus_xp,
    leveledUp,
    levelsGained,
  });
}
