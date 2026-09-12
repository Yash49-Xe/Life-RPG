import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Guild, GuildMember } from "@/types/database.types";

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/guilds/join
 * Body: { join_code: string }
 *
 * Joins a guild by its 6-char join_code.
 * Fails if user is already in any guild.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  let body: { join_code?: string };
  try { body = await request.json(); } catch { return err("Invalid JSON body", 400); }

  if (!body.join_code?.trim()) return err("join_code is required", 400);

  // Already in a guild?
  const { data: existing } = await (supabase
    .from("guild_members")
    .select("guild_id")
    .eq("user_id", user.id)
    .maybeSingle() as unknown as QueryResult<GuildMember>);

  if (existing) return err("You are already a member of a guild.", 409);

  // Find guild by join_code
  const { data: guild } = await (supabase
    .from("guilds")
    .select("*")
    .eq("join_code", body.join_code.trim().toUpperCase())
    .single() as unknown as QueryResult<Guild>);

  if (!guild) return err("Guild not found — check your join code.", 404);

  // Insert membership
  const { error: joinErr } = await (supabase
    .from("guild_members")
    // @ts-ignore — Supabase Insert type infers 'never' with strict generics
    .insert({ guild_id: guild.id, user_id: user.id }));

  if (joinErr) return err("Failed to join guild", 500);

  return ok({ guild, joined: true });
}
