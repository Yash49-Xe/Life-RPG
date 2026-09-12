import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Streak } from "@/types/database.types";

type ListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

/** GET /api/streaks — list all streak records for the current user */
export async function GET(_request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { data, error } = await (supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id)
    .order("category") as unknown as ListResult<Streak>);

  if (error) return err((error as Error).message, 500);
  return ok(data ?? []);
}
