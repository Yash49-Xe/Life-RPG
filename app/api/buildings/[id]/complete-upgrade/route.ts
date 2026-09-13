import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Building } from "@/types/database.types";

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/buildings/[id]/complete-upgrade
 *
 * Checks if the upgrade timer has elapsed and finalises the level-up.
 * Completion is server-side only — clients must call this endpoint to confirm.
 *
 * Sets: level += 1, status = 'idle', clears upgrade timestamps.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data: building, error: fetchErr } = await (supabase
    .from("buildings")
    .select("*")
    .eq("id", id)
    .single() as unknown as QueryResult<Building>);

  if (fetchErr || !building) return err("Building not found", 404);

  if (building.status !== "upgrading") {
    return err(`Building is not upgrading (current status: '${building.status}')`, 409);
  }

  if (!building.upgrade_complete_at) {
    return err("Upgrade completion time is missing", 500);
  }

  const now         = new Date();
  const completeAt  = new Date(building.upgrade_complete_at);
  const remainingSec = Math.max(0, Math.ceil((completeAt.getTime() - now.getTime()) / 1000));

  if (now < completeAt) {
    return err(
      `Upgrade not complete yet. ${remainingSec}s remaining (completes at ${building.upgrade_complete_at})`,
      425 // Too Early
    );
  }

  const { data: updated, error: updateErr } = await (supabase
    .from("buildings")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({
      level:               building.level + 1,
      status:              "idle",
      upgrade_started_at:  null,
      upgrade_complete_at: null,
    })
    .eq("id", id)
    .select()
    .single() as unknown as QueryResult<Building>);

  if (updateErr || !updated) return err("Failed to complete upgrade", 500);

  return ok({ building: updated, levelsGained: 1 });
}
