import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { rushCost } from "@/lib/coins";
import type { Building, Profile } from "@/types/database.types";

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

const MIN_REMAINING_SECONDS = 60; // Cannot rush below 60 seconds remaining

/**
 * POST /api/buildings/[id]/rush
 * Body: { seconds: number } — seconds to reduce from the upgrade timer
 *
 * Deducts coins from the user's profile and advances upgrade_complete_at.
 * Cannot rush below MIN_REMAINING_SECONDS.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;

  let body: { seconds?: number };
  try { body = await request.json(); } catch { return err("Invalid JSON body", 400); }

  const rushSeconds = body.seconds;
  if (!rushSeconds || rushSeconds <= 0) return err("seconds must be a positive number", 400);

  // Fetch building
  const { data: building } = await (supabase
    .from("buildings").select("*").eq("id", id)
    .single() as unknown as QueryResult<Building>);
  if (!building) return err("Building not found", 404);
  if (building.status !== "upgrading") return err("Building is not currently upgrading", 409);
  if (!building.upgrade_complete_at)   return err("Upgrade completion time missing", 500);

  const now             = new Date();
  const completeAt      = new Date(building.upgrade_complete_at);
  const totalRemaining  = Math.max(0, (completeAt.getTime() - now.getTime()) / 1000);

  if (totalRemaining <= MIN_REMAINING_SECONDS) {
    return err(`Cannot rush — upgrade has only ${Math.ceil(totalRemaining)}s remaining (min ${MIN_REMAINING_SECONDS}s)`, 409);
  }

  // Cap rush to not exceed the allowed minimum
  const maxRushable    = totalRemaining - MIN_REMAINING_SECONDS;
  const actualRush     = Math.min(rushSeconds, maxRushable);
  const cost           = rushCost(actualRush);

  // Fetch profile for coin balance
  const { data: profile } = await (supabase
    .from("profiles").select("coins").eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);
  if (!profile) return err("Profile not found", 500);

  if (profile.coins < cost) {
    return err(`Insufficient coins. Rush costs ${cost} coins, you have ${profile.coins}.`, 402);
  }

  // Deduct coins
  const newCoins = profile.coins - cost;
  await (supabase.from("profiles")
    // @ts-ignore
    .update({ coins: newCoins }).eq("id", user.id));

  // Advance upgrade_complete_at
  const newCompleteAt = new Date(completeAt.getTime() - actualRush * 1000);
  const { data: updated } = await (supabase
    .from("buildings")
    // @ts-ignore
    .update({ upgrade_complete_at: newCompleteAt.toISOString() })
    .eq("id", id).select().single() as unknown as QueryResult<Building>);

  return ok({
    building:         updated,
    secondsRushed:    actualRush,
    coinsSpent:       cost,
    coinsRemaining:   newCoins,
    newCompleteAt:    newCompleteAt.toISOString(),
  });
}
