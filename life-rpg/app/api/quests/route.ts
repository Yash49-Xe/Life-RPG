import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import { getTodayQuests } from "@/lib/quests";

/**
 * GET /api/quests
 * Returns today's daily quests. Auto-assigns 3 if none exist for today.
 * Idempotent — safe to call multiple times.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  try {
    const quests = await getTodayQuests(supabase, user.id);
    return ok(quests);
  } catch (e) {
    return err("Failed to fetch or assign quests", 500);
  }
}
