import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Guild, GuildMember } from "@/types/database.types";

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;
type ListResult<T>  = Promise<{ data: T[] | null; error: Error | null }>;

/**
 * GET /api/guilds/[id]/leaderboard
 *
 * Returns guild members ranked by character level then XP.
 * Only accessible by members of the guild.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;

  // Validate user is a member of this guild
  const { data: membership } = await (supabase
    .from("guild_members")
    .select("guild_id")
    .eq("guild_id", id)
    .eq("user_id", user.id)
    .maybeSingle() as unknown as QueryResult<GuildMember>);

  if (!membership) return err("You are not a member of this guild.", 403);

  // Fetch guild info
  const { data: guild } = await (supabase
    .from("guilds")
    .select("id, name, join_code, created_by")
    .eq("id", id)
    .single() as unknown as QueryResult<Guild>);

  if (!guild) return err("Guild not found", 404);

  // Fetch all members
  const { data: members } = await (supabase
    .from("guild_members")
    .select("user_id, joined_at")
    .eq("guild_id", id) as unknown as ListResult<GuildMember>);

  if (!members || members.length === 0) return ok({ guild, leaderboard: [] });

  const memberIds = members.map((m) => m.user_id);

  // Fetch character stats for all members
  const { data: characters } = await (supabase
    .from("character")
    .select("user_id, level, xp")
    .in("user_id", memberIds) as unknown as ListResult<{ user_id: string; level: number; xp: number }>);

  // Fetch profile emails for display
  const { data: profiles } = await (supabase
    .from("profiles")
    .select("id, email")
    .in("id", memberIds) as unknown as ListResult<{ id: string; email: string }>);

  const profileMap   = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  const characterMap = Object.fromEntries((characters ?? []).map((c) => [c.user_id, c]));

  const leaderboard = memberIds
    .map((uid, idx) => {
      const char    = characterMap[uid];
      const profile = profileMap[uid];
      const email   = profile?.email ?? "";
      return {
        rank:         0, // computed after sort
        user_id:      uid,
        display_name: email.split("@")[0] + "@...",
        level:        char?.level ?? 1,
        xp:           char?.xp   ?? 0,
        joined_at:    members[idx]?.joined_at ?? "",
      };
    })
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return ok({ guild, leaderboard });
}
