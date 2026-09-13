"use client";

import { Hammer, Zap, Check, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGame } from "@/components/game-provider";

const BUILDING_TIERS: Record<string, { icon: string; name: string; tiers: string[]; desc: string }> = {
  gym: {
    icon: "🏋️‍♂️",
    name: "Training Grounds",
    tiers: ["Dirt Pit", "Timber Yard", "Stone Arena", "Iron Colosseum", "Obsidian Forge"],
    desc: "Accelerates Fitness & Exercise building XP",
  },
  library: {
    icon: "📚",
    name: "Grand Library",
    tiers: ["Reading Nook", "Scroll Hut", "Stone Archive", "Arcane Academy", "Crystal Spire"],
    desc: "Accelerates Study & Focus building XP",
  },
  office: {
    icon: "💼",
    name: "Guild Office",
    tiers: ["Tent", "Timber Hall", "Stone Manor", "Banner Keep", "Citadel"],
    desc: "Accelerates Work building XP",
  },
  studio: {
    icon: "🎨",
    name: "Art Studio",
    tiers: ["Workbench", "Timber Atelier", "Glass Pavilion", "Muse Tower", "Aurora Gallery"],
    desc: "Accelerates Personal building XP",
  },
};

export function BuildingsRoute() {
  const { buildings, coins, now, startUpgrade, completeUpgrade, rushUpgrade } = useGame();

  const activeUpgrading = buildings.find((b) => b.status === "upgrading");

  const formatDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="game-label text-primary">Realm Architecture</p>
          <h2 className="panel-title text-2xl text-white mt-1">My Village 🏰</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Complete category tasks to gain building XP. Upgrade structures to evolve your settlement.
          </p>
        </div>

        <div className="currency-chip">
          <span>🪙</span> <strong>{coins} Coins Available</strong>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {buildings.map((building) => {
          const typeKey = building.type.toLowerCase();
          const info = BUILDING_TIERS[typeKey] || {
            icon: "🏛️",
            name: building.type.toUpperCase(),
            tiers: ["Base Outpost", "Timber Structure", "Stone Keep", "Fortress", "Citadel"],
            desc: "Village Building",
          };

          const tierIndex = Math.min(info.tiers.length - 1, Math.max(0, building.level - 1));
          const tierTitle = info.tiers[tierIndex];

          const isReady = building.status === "ready";
          const isUpgrading = building.status === "upgrading";
          const xpPct = Math.min(100, Math.floor((building.current_xp / building.xp_required_next) * 100));

          const msLeft = building.upgrade_complete_at
            ? Math.max(0, new Date(building.upgrade_complete_at).getTime() - now)
            : 0;

          const secondsLeft = Math.ceil(msLeft / 1000);
          const rushCostCoins = Math.max(1, Math.ceil(secondsLeft / 30) * 2);

          return (
            <motion.div
              key={building.id}
              whileHover={{ y: -2 }}
              className={`glass-panel p-6 space-y-4 border-2 transition-all flex flex-col justify-between ${
                isReady ? "border-reward shadow-reward" : isUpgrading ? "border-purple-500" : "border-border"
              }`}
            >
              {/* Top Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center border-2 border-primary bg-primary/10 text-3xl shadow-glow">
                    {info.icon}
                  </div>
                  <div>
                    <span className="game-label text-primary">{tierTitle}</span>
                    <h3 className="panel-title text-xl text-white mt-0.5">{info.name}</h3>
                    <p className="text-xs text-muted-foreground">{info.desc}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="level-chip">LVL {building.level}</span>
                  {building.streak_bonus_active && (
                    <div className="text-[10px] text-reward font-bold mt-1">
                      🔥 Streak XP Active
                    </div>
                  )}
                </div>
              </div>

              {/* XP Progress Track */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Building XP</span>
                  <span className="text-primary font-mono">
                    {building.current_xp} / {building.xp_required_next} XP ({xpPct}%)
                  </span>
                </div>
                <div className="progress-track">
                  <motion.div
                    className={`h-full ${isReady ? "bg-reward" : "progress-fill"}`}
                    initial={false}
                    animate={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>

              {/* Status & Action Buttons */}
              <div className="pt-2">
                {isReady ? (
                  <Button
                    variant="reward"
                    disabled={!!activeUpgrading}
                    onClick={() => startUpgrade(building.id)}
                    className="w-full py-3 font-bold text-sm cursor-pointer"
                  >
                    {activeUpgrading ? "Builder Queue Busy (1 Concurrent Upgrade)" : `🚀 Start Upgrade to Level ${building.level + 1}`}
                  </Button>
                ) : isUpgrading ? (
                  <div className="space-y-2">
                    <div className="block-inset bg-muted/40 p-3 flex justify-between items-center text-xs">
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <Hammer className="h-4 w-4" /> Construction in Progress
                      </span>
                      <strong className="panel-title text-sm text-reward font-mono">
                        {formatDuration(msLeft)}
                      </strong>
                    </div>

                    {msLeft <= 0 ? (
                      <Button variant="reward" onClick={() => completeUpgrade(building.id)} className="w-full py-2">
                        <Check className="h-4 w-4 mr-1" /> Finish Upgrade Now
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        disabled={coins < rushCostCoins}
                        onClick={() => rushUpgrade(building.id)}
                        className="w-full py-2 text-xs font-bold border-reward/40 text-reward hover:bg-reward/10"
                      >
                        <Zap className="h-4 w-4 mr-1" /> Rush Upgrade ({rushCostCoins} Coins)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="block-inset bg-muted/20 p-3 text-center text-xs text-muted-foreground">
                    Accumulate {building.xp_required_next - building.current_xp} more XP from linked category tasks to unlock upgrade.
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
