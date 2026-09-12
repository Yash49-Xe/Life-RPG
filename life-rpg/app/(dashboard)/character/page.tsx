import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { xpRequiredForLevel } from "@/lib/leveling";
import type { Character, Profile } from "@/types/database.types";

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

export default async function CharacterPage() {
  const auth = await requireUser();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }
  const { user, supabase } = auth;

  // 1. Fetch character
  const { data: charData } = await (supabase
    .from("character")
    .select("*")
    .eq("user_id", user.id)
    .single() as unknown as QueryResult<Character>);
  const character = charData;

  // 2. Fetch profile
  const { data: profData } = await (supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);
  const profile = profData;

  const level = character?.level ?? 1;
  const currentXp = character?.xp ?? 0;
  const xpForNextLevel = xpRequiredForLevel(level + 1);
  const xpPct = Math.min(100, Math.floor((currentXp / xpForNextLevel) * 100));

  // Calculated attributes based on level & tasks
  const strength = 10 + (level - 1) * 2;
  const intelligence = 12 + (level - 1) * 3;
  const endurance = 8 + (level - 1) * 2;
  const creativity = 9 + (level - 1) * 2;

  const attributes = [
    { name: "Strength", value: strength, icon: "💪", color: "from-rose-500 to-orange-400", desc: "Earned via Fitness & Exercise tasks" },
    { name: "Intelligence", value: intelligence, icon: "🧠", color: "from-blue-500 to-cyan-400", desc: "Earned via Study & Focus tasks" },
    { name: "Endurance", value: endurance, icon: "🛡️", color: "from-emerald-500 to-teal-400", desc: "Earned via Streaks & Consistency" },
    { name: "Creativity", value: creativity, icon: "✨", color: "from-purple-500 to-pink-400", desc: "Earned via Personal & Work tasks" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
          Adventurer Sheet
        </span>
        <h2 className="text-3xl font-black text-white mt-1">
          Character Profile 🧙‍♂️
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Track your non-linear level growth, attribute points, and economic progress.
        </p>
      </div>

      {/* Main Character Hero Card */}
      <div className="glass-panel p-8 rounded-2xl border border-indigo-500/20 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-6xl shadow-2xl shadow-amber-500/30">
            🧙‍♂️
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-2xl font-black text-white">
                  {profile?.email?.split("@")[0] || "Hero"}
                </h3>
                <p className="text-xs text-indigo-300 font-mono">{user.email}</p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-3">
                <span className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-sm font-black text-amber-300">
                  LEVEL {level}
                </span>
                <span className="rounded-xl bg-yellow-400/20 border border-yellow-400/40 px-4 py-2 text-sm font-black text-yellow-300">
                  🪙 {profile?.coins ?? 0} Coins
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-300">Non-Linear XP Progress</span>
                <span className="text-slate-400">
                  {currentXp} / {xpForNextLevel} XP ({xpPct}%)
                </span>
              </div>
              <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-700 shadow-md"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-right">
                Formula: XP Threshold = 100 × Level<sup>1.5</sup>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📊</span> Attribute Attributes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attributes.map((attr) => (
            <div
              key={attr.name}
              className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between space-x-4"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${attr.color} text-2xl shadow-lg`}>
                  {attr.icon}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{attr.name}</h4>
                  <p className="text-xs text-slate-400">{attr.desc}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-amber-300 font-mono">
                  {attr.value}
                </div>
                <span className="text-[10px] text-slate-500">PTS</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
