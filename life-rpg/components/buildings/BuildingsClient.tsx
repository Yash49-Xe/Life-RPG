"use client";

import { useState, useEffect } from "react";
import type { Building, Profile } from "@/types/database.types";

interface BuildingsClientProps {
  initialBuildings: Building[];
  initialProfile: Profile | null;
}

const BUILDING_ICONS: Record<string, { icon: string; name: string; desc: string }> = {
  gym: { icon: "🏋️‍♂️", name: "Training Gym", desc: "Linked to Fitness tasks" },
  library: { icon: "📚", name: "Grand Library", desc: "Linked to Study & Focus tasks" },
  office: { icon: "💼", name: "Guild Office", desc: "Linked to Work tasks" },
  studio: { icon: "🎨", name: "Art Studio", desc: "Linked to Personal tasks" },
  townhall: { icon: "🏰", name: "Town Hall", desc: "Overall Village Center" },
};

function getBuildingTier(level: number) {
  if (level >= 5) return { name: "Grand Citadel", color: "from-amber-500 to-yellow-300", border: "border-amber-500/50" };
  if (level >= 3) return { name: "Stone Manor", color: "from-purple-500 to-indigo-400", border: "border-purple-500/40" };
  return { name: "Wooden Hut", color: "from-indigo-600 to-blue-500", border: "border-white/10" };
}

export function BuildingsClient({ initialBuildings, initialProfile }: BuildingsClientProps) {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [coins, setCoins] = useState<number>(initialProfile?.coins ?? 0);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const announce = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find active upgrading building
  const upgradingBuilding = buildings.find((b) => b.status === "upgrading");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!upgradingBuilding?.upgrade_complete_at) {
      setSecondsRemaining(0);
      return;
    }

    const calcTime = () => {
      const target = new Date(upgradingBuilding.upgrade_complete_at!).getTime();
      const now = Date.now();
      setSecondsRemaining(Math.max(0, Math.floor((target - now) / 1000)));
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [upgradingBuilding?.upgrade_complete_at]);

  // Start Upgrade Handler
  const handleStartUpgrade = async (buildingId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/buildings/${buildingId}/start-upgrade`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start upgrade");

      setBuildings((prev) =>
        prev.map((b) => (b.id === buildingId ? data.building : b))
      );
      announce(`🔨 Upgrade started! Complete at ${new Date(data.building.upgrade_complete_at).toLocaleTimeString()}`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Start upgrade error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Complete Upgrade Handler
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
      announce(`✨ Building upgraded to Level ${data.building.level}!`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Complete upgrade error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Rush Upgrade Handler (Coin spend)
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
      announce(`⚡ Fast-forwarded upgrade using coins!`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Rush error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-4 text-sm text-indigo-300 flex justify-between items-center shadow-lg">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-xs text-slate-400">✕</button>
        </div>
      )}

      {/* Village Header */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Village Architecture
          </span>
          <h2 className="text-3xl font-black text-white mt-1">
            Your Settlement 🏰
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Complete category tasks to gain building XP. When XP threshold is reached, start an upgrade!
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl bg-slate-900/80 p-3 border border-yellow-500/30">
          <span className="text-2xl">🪙</span>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Available Coins</div>
            <div className="text-lg font-black text-yellow-400">{coins} Coins</div>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {buildings.map((building) => {
          const typeInfo = BUILDING_ICONS[building.type.toLowerCase()] || {
            icon: "🏛️",
            name: building.type,
            desc: "Village Building",
          };
          const tier = getBuildingTier(building.level);
          const xpPct = Math.min(100, Math.floor((building.current_xp / building.xp_required_next) * 100));
          const isUpgrading = building.status === "upgrading";
          const isReady = building.status === "ready";

          return (
            <div
              key={building.id}
              className={`glass-panel p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-4 ${tier.border} ${
                isReady ? "border-amber-500 shadow-xl shadow-amber-500/10" : ""
              }`}
            >
              {/* Top Banner */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${tier.color} text-3xl shadow-lg`}>
                    {typeInfo.icon}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{tier.name}</span>
                    <h3 className="text-xl font-black text-white">{typeInfo.name}</h3>
                    <p className="text-xs text-indigo-300">{typeInfo.desc}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-full bg-slate-800 border border-white/10 px-3 py-1 text-xs font-black text-amber-300">
                    LVL {building.level}
                  </span>
                  {building.streak_bonus_active && (
                    <div className="text-[10px] text-amber-400 font-semibold mt-1">
                      🔥 Streak Bonus Active
                    </div>
                  )}
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Building XP</span>
                  <span className="text-indigo-300">
                    {building.current_xp} / {building.xp_required_next} XP ({xpPct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isReady ? "bg-amber-400 animate-pulse-glow" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                    }`}
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>

              {/* Status Action Panel */}
              <div className="pt-2">
                {isReady ? (
                  <button
                    disabled={loading || !!upgradingBuilding}
                    onClick={() => handleStartUpgrade(building.id)}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 py-3 font-bold text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {upgradingBuilding ? "Queue Busy (1 Upgrade at a Time)" : `🚀 Start Upgrade to Level ${building.level + 1}`}
                  </button>
                ) : isUpgrading ? (
                  <div className="space-y-2">
                    <div className="rounded-xl bg-purple-950/40 p-3 border border-purple-500/30 flex justify-between items-center text-xs">
                      <span className="text-purple-300 font-semibold">🔨 Upgrade in Progress</span>
                      <span className="font-mono font-bold text-amber-300 text-sm">
                        {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                      </span>
                    </div>

                    {secondsRemaining <= 0 ? (
                      <button
                        onClick={() => handleCompleteUpgrade(building.id)}
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        ✨ Complete Upgrade
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRush(building.id)}
                        disabled={loading || coins < 2}
                        className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold text-yellow-300 border border-yellow-500/30 transition-all cursor-pointer"
                      >
                        ⚡ Rush with Coins (Cost: 2 Coins / 30s)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-900/50 p-3 text-center border border-white/5">
                    <span className="text-xs text-slate-400">
                      Accumulate {building.xp_required_next - building.current_xp} more XP from linked category tasks to unlock upgrade.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
