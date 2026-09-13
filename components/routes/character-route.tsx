"use client";

import { Shield, Zap, Flame, Sparkles, Award, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { useGame } from "@/components/game-provider";
import { xpRequiredForLevel } from "@/lib/leveling";

export function CharacterRoute() {
  const { level, xp, coins, profile } = useGame();

  const totalXp = xpRequiredForLevel(level + 1);
  const progress = Math.min(100, Math.floor((xp / totalXp) * 100));

  const strength = 10 + (level - 1) * 2;
  const intelligence = 12 + (level - 1) * 3;
  const discipline = 8 + (level - 1) * 2;
  const creativity = 9 + (level - 1) * 2;

  const attributes = [
    { name: "Strength", value: strength, icon: "💪", color: "text-rose-400 border-rose-500/40 bg-rose-500/10", desc: "Earned via Fitness & Exercise quests" },
    { name: "Intelligence", value: intelligence, icon: "🧠", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10", desc: "Earned via Study & Focus quests" },
    { name: "Discipline", value: discipline, icon: "🛡️", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", desc: "Earned via Category Streaks & Consistency" },
    { name: "Creativity", value: creativity, icon: "✨", color: "text-purple-400 border-purple-500/40 bg-purple-500/10", desc: "Earned via Personal & Work quests" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <p className="game-label text-primary">Adventurer Profile</p>
        <h2 className="panel-title text-2xl text-white mt-1">Character Sheet 🧙‍♂️</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Track your non-linear level evolution, attribute points, and economic prosperity.
        </p>
      </div>

      {/* Main Hero Profile Card */}
      <div className="glass-panel p-8 space-y-6 border-2 border-primary/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center border-4 border-primary bg-primary/20 text-6xl shadow-glow">
              🧙‍♂️
            </div>
            <span className="absolute -bottom-3 -right-3 level-chip">LVL {level}</span>
          </div>

          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="panel-title text-2xl text-white">Pathfinder Adventurer</h3>
                <p className="text-xs text-primary font-mono font-bold">Realm Rank: Veteran Explorer</p>
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-3">
                <div className="currency-chip">
                  <Coins className="h-4 w-4" /> <strong>{coins} Coins</strong>
                </div>
              </div>
            </div>

            {/* XP Progress Track */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-primary">Non-Linear Level XP</span>
                <span className="text-muted-foreground font-mono">
                  {xp.toLocaleString()} / {totalXp.toLocaleString()} XP ({progress}%)
                </span>
              </div>
              <div className="progress-track h-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="progress-fill" />
              </div>
              <p className="text-[10px] text-muted-foreground text-right font-mono">
                Threshold: XP = 100 × Level<sup>1.5</sup>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="space-y-4">
        <h3 className="panel-title text-lg text-white flex items-center gap-2">
          <span>📊</span> Attribute Breakdown
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {attributes.map((attr) => (
            <motion.div
              key={attr.name}
              whileHover={{ y: -2 }}
              className="glass-panel p-5 flex items-center justify-between space-x-4 border-2 border-border"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center border-2 text-2xl ${attr.color}`}>
                  {attr.icon}
                </div>
                <div>
                  <h4 className="panel-title text-base text-white">{attr.name}</h4>
                  <p className="text-xs text-muted-foreground">{attr.desc}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="panel-title text-2xl text-reward font-mono">
                  {attr.value}
                </div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Points</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gym Location Settings Card */}
      <div className="glass-panel p-6 space-y-4 border-2 border-primary/30">
        <div className="flex justify-between items-center">
          <div>
            <span className="game-label text-primary">GPS Verification Realm</span>
            <h3 className="panel-title text-lg text-white mt-0.5">Default Gym Location 🏋️</h3>
          </div>
        </div>

        {profile?.gym_latitude != null && profile?.gym_longitude != null ? (
          <div className="block-inset bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-white">{profile.gym_name || "My Gym"}</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Latitude: {profile.gym_latitude.toFixed(4)}, Longitude: {profile.gym_longitude.toFixed(4)}
              </p>
            </div>
            <span className="level-chip bg-success/20 text-success border-success/40">
              ✓ Registered & Ready for Verification
            </span>
          </div>
        ) : (
          <div className="block-inset bg-amber-500/10 p-4 text-xs text-amber-300 border-2 border-amber-500/30">
            No Gym location registered yet. When starting a Gym quest, you will be prompted to save your gym location!
          </div>
        )}
      </div>
    </div>
  );
}
