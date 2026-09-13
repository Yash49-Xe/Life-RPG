import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { upgradeDurationSeconds, xpRequiredForBuildingLevel } from "@/lib/buildings";
import type { Building } from "@/types/database.types";

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/buildings/[id]/start-upgrade
 *
 * Starts a building upgrade. Requirements:
 *  1. Building status must be 'ready' (current_xp >= xp_required_next)
 *  2. User must have no other building currently upgrading (queue = 1)
 *
 * Sets: status='upgrading', upgrade_started_at=NOW(),
 *       upgrade_complete_at=NOW()+duration, resets current_xp=0,
 *       updates xp_required_next for the next level.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;

  // Fetch the target building
  const { data: building, error: fetchErr } = await (supabase
    .from("buildings")
    .select("*")
    .eq("id", id)
    .single() as unknown as QueryResult<Building>);

  if (fetchErr || !building) return err("Building not found", 404);

  // Must be ready (enough XP accumulated)
  if (building.status !== "ready") {
    return err(
      `Building status is '${building.status}'. Must be 'ready' to start upgrade.`,
      409
    );
  }

  // Check builder queue — max 1 concurrent upgrade per user
  const { count } = await supabase
    .from("buildings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "upgrading");

  if (count && count >= 1) {
    return err("Builder busy — only 1 concurrent upgrade allowed per user.", 409);
  }

  // Compute upgrade window
  const targetLevel = building.level + 1;
  const durationSec = upgradeDurationSeconds(targetLevel);
  const now         = new Date();
  const completeAt  = new Date(now.getTime() + durationSec * 1000);

  const { data: updated, error: updateErr } = await (supabase
    .from("buildings")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({
      status:              "upgrading",
      upgrade_started_at:  now.toISOString(),
      upgrade_complete_at: completeAt.toISOString(),
      current_xp:          0,
      xp_required_next:    xpRequiredForBuildingLevel(targetLevel + 1),
    })
    .eq("id", id)
    .select()
    .single() as unknown as QueryResult<Building>);

  if (updateErr || !updated) return err("Failed to start upgrade", 500);

  return ok({
    building:        updated,
    upgradeSeconds:  durationSec,
    completeAt:      completeAt.toISOString(),
  });
}
