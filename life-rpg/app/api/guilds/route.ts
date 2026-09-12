import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Guild, GuildMember } from "@/types/database.types";

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;
type ListResult<T>  = Promise<{ data: T[] | null; error: Error | null }>;

// ── GET /api/guilds ────────────────────────────────────────────────────────────
// Returns the guild the current user belongs to, or null.

export async function GET(_request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // Find membership
  const { data: membership } = await (supabase
    .from("guild_members")
    .select("guild_id")
    .eq("user_id", user.id)
    .maybeSingle() as unknown as QueryResult<GuildMember>);

  if (!membership) return ok(null);

  const { data: guild } = await (supabase
    .from("guilds")
    .select("*")
    .eq("id", membership.guild_id)
    .single() as unknown as QueryResult<Guild>);

  return ok(guild);
}

// ── POST /api/guilds ───────────────────────────────────────────────────────────
// Creates a new guild. Body: { name: string }
// Auto-generates a 6-char uppercase join_code.

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  let body: { name?: string };
  try { body = await request.json(); } catch { return err("Invalid JSON body", 400); }

  if (!body.name?.trim()) return err("name is required", 400);

  // Check user isn't already in a guild
  const { data: existing } = await (supabase
    .from("guild_members")
    .select("guild_id")
    .eq("user_id", user.id)
    .maybeSingle() as unknown as QueryResult<GuildMember>);

  if (existing) return err("You are already a member of a guild.", 409);

  // Generate join code
  const join_code = generateJoinCode();

  const { data: guild, error: guildErr } = await (supabase
    .from("guilds")
    // @ts-ignore — Supabase Insert type infers 'never' with strict generics
    .insert({ name: body.name.trim(), join_code, created_by: user.id })
    .select()
    .single() as unknown as QueryResult<Guild>);

  if (guildErr || !guild) return err("Failed to create guild", 500);

  // Auto-join creator
  await (supabase
    .from("guild_members")
    // @ts-ignore
    .insert({ guild_id: guild.id, user_id: user.id }));

  return ok(guild, 201);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
