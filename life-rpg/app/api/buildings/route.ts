import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { DEFAULT_BUILDINGS, xpRequiredForBuildingLevel } from "@/lib/buildings";
import type { Building } from "@/types/database.types";

type ListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

/**
 * GET /api/buildings
 * Returns all buildings for the authenticated user.
 * Auto-creates 4 default buildings (gym, library, office, studio) on first call.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  let { data: buildings } = await (supabase
    .from("buildings")
    .select("*")
    .eq("user_id", user.id)
    .order("type") as unknown as ListResult<Building>);

  // Auto-create default buildings if none exist yet
  if (!buildings || buildings.length === 0) {
    const rows = DEFAULT_BUILDINGS.map((b) => ({
      user_id:          user.id,
      type:             b.type,
      linked_category:  b.linked_category,
      level:            1,
      current_xp:       0,
      xp_required_next: xpRequiredForBuildingLevel(1),
      status:           "idle" as const,
      streak_bonus_active: false,
    }));

    const { data: created } = await (supabase
      .from("buildings")
      // @ts-ignore — Supabase Insert type infers 'never' with strict generics
      .insert(rows)
      .select() as unknown as ListResult<Building>);

    buildings = created ?? [];
  }

  return ok(buildings);
}
