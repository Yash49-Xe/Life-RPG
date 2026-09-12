import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import type { Guild } from "@/types/database.types";
import { GuildClient } from "@/components/guilds/GuildClient";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  level: number;
  xp: number;
  rank: number;
}

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;
type QueryListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

export default async function GuildPage() {
  const auth = await requireUser();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }
  const { user, supabase } = auth;

  // 1. Fetch Global Leaderboard
  const { data: globalData } = await (supabase
    .from("leaderboard")
    .select("*")
    .limit(50) as unknown as QueryListResult<LeaderboardEntry>);
  const globalLeaderboard = globalData ?? [];

  // 2. Fetch User's Guild Membership
  const { data: memberData } = await (supabase
    .from("guild_members")
    .select("guild_id")
    .eq("user_id", user.id)
    .maybeSingle() as unknown as QueryResult<{ guild_id: string }>);

  let userGuild: Guild | null = null;
  let guildLeaderboard: LeaderboardEntry[] = [];

  if (memberData?.guild_id) {
    const { data: guildData } = await (supabase
      .from("guilds")
      .select("*")
      .eq("id", memberData.guild_id)
      .single() as unknown as QueryResult<Guild>);
    userGuild = guildData;

    if (userGuild) {
      // Fetch guild members
      const { data: gMembers } = await (supabase
        .from("guild_members")
        .select("user_id")
        .eq("guild_id", userGuild.id) as unknown as QueryListResult<{ user_id: string }>);

      const memberIds = (gMembers ?? []).map((m) => m.user_id);
      if (memberIds.length > 0) {
        const { data: gLeaderboard } = await (supabase
          .from("leaderboard")
          .select("*")
          .in("user_id", memberIds) as unknown as QueryListResult<LeaderboardEntry>);
        guildLeaderboard = gLeaderboard ?? [];
      }
    }
  }

  return (
    <GuildClient
      initialLeaderboard={globalLeaderboard}
      userGuild={userGuild}
      guildLeaderboard={guildLeaderboard}
    />
  );
}
