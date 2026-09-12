import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type AuthSuccess = { user: User; supabase: SupabaseClient<Database>; error: null };
type AuthFailure = { user: null; supabase: null; error: NextResponse };

/**
 * Verifies the current session in a Route Handler.
 * Returns the authenticated user + supabase client, or a 401 NextResponse.
 *
 * Usage:
 *   const auth = await requireUser();
 *   if (auth.error) return auth.error;
 *   const { user, supabase } = auth;
 */
export async function requireUser(): Promise<AuthSuccess | AuthFailure> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      supabase: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, supabase, error: null };
}
