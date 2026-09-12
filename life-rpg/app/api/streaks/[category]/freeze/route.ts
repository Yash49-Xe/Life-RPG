import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Streak } from "@/types/database.types";

interface Params { params: Promise<{ category: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/streaks/[category]/freeze
 *
 * Applies a streak freeze for the given category.
 * The freeze protects a streak for one missed day without resetting it.
 *
 * Requirements:
 * - A streak row must exist for this category
 * - freeze_available must be true
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { category } = await params;

  // Fetch existing streak
  const { data: streak } = await (supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", category)
    .single() as unknown as QueryResult<Streak>);

  if (!streak) {
    return err(`No streak found for category '${category}'. Complete a task first.`, 404);
  }

  if (!streak.freeze_available) {
    return err("No streak freeze available for this category.", 409);
  }

  // Apply freeze: set last_completed_date to today so next day looks consecutive
  const today = new Date().toISOString().split("T")[0];

  const { data: updated } = await (supabase
    .from("streaks")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({ last_completed_date: today, freeze_available: false })
    .eq("user_id", user.id)
    .eq("category", category)
    .select()
    .single() as unknown as QueryResult<Streak>);

  return ok({ streak: updated, freezeApplied: true });
}
