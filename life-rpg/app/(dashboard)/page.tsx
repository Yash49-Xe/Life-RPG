import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { xpRequiredForLevel } from "@/lib/leveling";
import type { Character, Profile, Building, Streak, DailyQuest } from "@/types/database.types";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;
type QueryListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

export default async function DashboardPage() {
  const auth = await requireUser();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }
  const { user, supabase } = auth;

  // 1. Fetch character data
  const { data: charData } = await (supabase
    .from("character")
    .select("*")
    .eq("user_id", user.id)
    .single() as unknown as QueryResult<Character>);
  const character = charData;

  // 2. Fetch profile data (coins)
  const { data: profData } = await (supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);
  const profile = profData;

  // 3. Fetch buildings
  const { data: buildingsData } = await (supabase
    .from("buildings")
    .select("*")
    .eq("user_id", user.id) as unknown as QueryListResult<Building>);
  const buildings = buildingsData ?? [];

  // 4. Fetch streaks
  const { data: streaksData } = await (supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id) as unknown as QueryListResult<Streak>);
  const streaks = streaksData ?? [];

  // 5. Fetch daily quests
  const { data: questsData } = await (supabase
    .from("quests")
    .select("*")
    .eq("user_id", user.id) as unknown as QueryListResult<DailyQuest>);
  const quests = questsData ?? [];

  const level = character?.level ?? 1;
  const currentXp = character?.xp ?? 0;
  const xpForNextLevel = xpRequiredForLevel(level + 1);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Welcome Back, Adventurer
          </span>
          <h2 className="text-3xl font-black text-white mt-1">
            Dashboard Overview ⚔️
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Complete tasks, earn XP & coins, expand your village buildings, and climb the guild ranks.
          </p>
        </div>
      </div>

      <DashboardClient
        character={character}
        profile={profile}
        buildings={buildings}
        streaks={streaks}
        quests={quests}
        xpForNextLevel={xpForNextLevel}
      />
    </div>
  );
}
