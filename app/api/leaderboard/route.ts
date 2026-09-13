import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";

/**
 * GET /api/leaderboard
 * Returns the top 50 users ranked by character level then XP.
 * Uses the `leaderboard` view created in migration 00011.
 * Email is truncated to `user@...` for privacy.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("leaderboard")
    .select("user_id, rank, display_name, level, xp")
    .order("rank", { ascending: true })
    .limit(50);

  if (error) return err(error.message, 500);
  return ok(data ?? []);
}
