"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Character, Profile, Building, Streak, DailyQuest } from "@/types/database.types";

interface DashboardClientProps {
  character: Character | null;
  profile: Profile | null;
  buildings: Building[];
  streaks: Streak[];
  quests: DailyQuest[];
  xpForNextLevel: number;
}

export function DashboardClient({
  character,
  profile,
  buildings: initialBuildings,
  streaks: initialStreaks,
  quests: initialQuests,
  xpForNextLevel,
}: DashboardClientProps) {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [streaks, setStreaks] = useState<Streak[]>(initialStreaks);
  const [quests, setQuests] = useState<DailyQuest[]>(initialQuests);
  const [coins, setCoins] = useState<number>(profile?.coins ?? 0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Active upgrading building
  const upgradingBuilding = buildings.find((b) => b.status === "upgrading");
  const readyBuilding = buildings.find((b) => b.status === "ready");

  // Countdown seconds state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!upgradingBuilding?.upgrade_complete_at) {
      setSecondsRemaining(0);
      return;
    }

    const calcTime = () => {
      const target = new Date(upgradingBuilding.upgrade_complete_at!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setSecondsRemaining(diff);
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [upgradingBuilding?.upgrade_complete_at]);

  const level = character?.level ?? 1;
  const currentXp = character?.xp ?? 0;
  const xpPct = Math.min(100, Math.floor((currentXp / xpForNextLevel) * 100));

  // Handle Coin Rush
  const handleRush = async (buildingId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buildings/${buildingId}/rush`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rush upgrade");

      setCoins(data.coinsRemaining);
      setBuildings((prev) =>
        prev.map((b) => (b.id === buildingId ? data.building : b))
      );
      setActionMessage("⚡ Upgrade rushed with coins!");
    } catch (err: unknown) {
      setActionMessage(`❌ ${err instanceof Error ? err.message : "Rush error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Complete Upgrade
  const handleCompleteUpgrade = async (buildingId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buildings/${buildingId}/complete-upgrade`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete upgrade");

      setBuildings((prev) =>
        prev.map((b) => (b.id === buildingId ? data.building : b))
      );
      setActionMessage("🏰 Building upgrade completed!");
    } catch (err: unknown) {
      setActionMessage(`❌ ${err instanceof Error ? err.message : "Completion error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Freeze Streak
  const handleFreezeStreak = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/streaks/${category}/freeze`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to freeze streak");

      setStreaks((prev) =>
        prev.map((s) => (s.category === category ? data.streak : s))
      );
      setActionMessage(`❄️ Streak frozen for ${category}!`);
    } catch (err: unknown) {
      setActionMessage(`❌ ${err instanceof Error ? err.message : "Freeze error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {actionMessage && (
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3 text-sm text-indigo-300 flex justify-between items-center">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs text-slate-400">✕</button>
        </div>
      )}

      {/* Grid: Character Card & Upgrading Building Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Character Card */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-3xl shadow-lg shadow-amber-500/20">
                🧙‍♂️
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Character Level</span>
                <h3 className="text-2xl font-black text-white">Level {level}</h3>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Coins</span>
              <div className="text-xl font-bold text-yellow-400">🪙 {coins}</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-indigo-300">XP Progress</span>
              <span className="text-slate-400">{currentXp} / {xpForNextLevel} XP ({xpPct}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link href="/character" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View Character Stats & Attributes →
            </Link>
          </div>
        </div>

        {/* Upgrading Building Widget */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🏰</span> Village Construction Queue
            </h3>
            <Link href="/buildings" className="text-xs font-semibold text-indigo-400 hover:underline">
              Village View →
            </Link>
          </div>

          {upgradingBuilding ? (
            <div className="rounded-xl bg-slate-900/80 p-4 border border-purple-500/30 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-purple-400 uppercase">Upgrading</span>
                  <div className="text-base font-bold text-white capitalize">{upgradingBuilding.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-black text-amber-300">
                    {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                  </div>
                  <span className="text-[10px] text-slate-400">Target Level {upgradingBuilding.level + 1}</span>
                </div>
              </div>

              {secondsRemaining <= 0 ? (
                <button
                  onClick={() => handleCompleteUpgrade(upgradingBuilding.id)}
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  ✨ Complete Upgrade Now
                </button>
              ) : (
                <button
                  onClick={() => handleRush(upgradingBuilding.id)}
                  disabled={loading || coins < 2}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 py-2 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  ⚡ Fast-Forward with Coins (Cost: 2 Coins / 30s)
                </button>
              )}
            </div>
          ) : readyBuilding ? (
            <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30 text-center space-y-2">
              <span className="text-xs font-semibold text-amber-400 uppercase">Ready for Upgrade</span>
              <div className="text-base font-bold text-white capitalize">{readyBuilding.type} (Level {readyBuilding.level})</div>
              <p className="text-xs text-slate-300">Building has accumulated enough XP to advance to Level {readyBuilding.level + 1}.</p>
              <Link href="/buildings" className="inline-block rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950">
                Start Upgrade in Village
              </Link>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-900/40 p-6 border border-white/5 text-center text-slate-400">
              <span className="text-3xl block mb-2">🔨</span>
              <p className="text-xs">No active building upgrade in progress.</p>
              <p className="text-[11px] text-slate-500 mt-1">Complete category tasks to gain building XP and unlock upgrades.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Active Streaks & Today's Daily Quests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Streaks */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔥</span> Category Streaks
            </h3>
            <span className="text-xs text-slate-400">Daily Increment</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {["fitness", "study", "work", "personal"].map((cat) => {
              const streakObj = streaks.find((s) => s.category.toLowerCase() === cat);
              const streakCount = streakObj?.current_streak ?? 0;
              const freezeAvailable = streakObj?.freeze_available ?? false;

              return (
                <div key={cat} className="rounded-xl bg-slate-900/60 p-3 border border-white/5 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300 capitalize">{cat}</span>
                    <span className="text-amber-400 text-xs font-bold">🔥 {streakCount} Days</span>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">
                      {streakCount >= 3 ? "⭐ Bonus Active" : "Need 3+ streak"}
                    </span>
                    {freezeAvailable && (
                      <button
                        onClick={() => handleFreezeStreak(cat)}
                        disabled={loading}
                        className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        ❄️ Freeze
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Daily Quests */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🎯</span> Daily Quests
            </h3>
            <Link href="/tasks" className="text-xs text-indigo-400 hover:underline">
              View Tasks Board →
            </Link>
          </div>

          {initialQuests.length === 0 ? (
            <div className="rounded-xl bg-slate-900/40 p-6 text-center text-slate-500 text-xs">
              Daily quests auto-assign upon visiting the Tasks page.
            </div>
          ) : (
            <div className="space-y-2.5">
              {initialQuests.slice(0, 3).map((q) => (
                <div key={q.id} className="rounded-xl bg-slate-900/60 p-3 border border-white/5 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-white">{q.task_template}</div>
                    <span className="text-[10px] text-slate-400">Assigned: Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-xs font-bold">
                      +{q.bonus_xp} XP
                    </span>
                    <span className={`text-xs font-semibold ${q.status === "completed" ? "text-emerald-400" : "text-slate-400"}`}>
                      {q.status === "completed" ? "Completed ✓" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
