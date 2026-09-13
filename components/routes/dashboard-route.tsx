"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Gift,
  Hammer,
  Palette,
  ShieldCheck,
  Snowflake,
  Swords,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGame } from "@/components/game-provider";
import { xpRequiredForLevel } from "@/lib/leveling";

const streakIcons: Record<string, typeof BookOpen> = {
  Study: BookOpen,
  Exercise: Swords,
  Work: ShieldCheck,
  Personal: Palette,
  Fitness: Swords,
};

export function DashboardRoute() {
  const {
    level,
    xp,
    tasks,
    buildings,
    streaks,
    quests,
    coins,
    now,
    claimQuest,
    useFreeze,
    startUpgrade,
    rushUpgrade,
    completeUpgrade,
  } = useGame();

  const total = xpRequiredForLevel(level + 1);
  const progress = Math.min(100, Math.floor((xp / total) * 100));

  const openQuests = tasks.filter((task) => task.status === "pending").slice(0, 3);
  const upgradingBuilding = buildings.find((item) => item.status === "upgrading");
  const readyBuilding = buildings.find((item) => item.status === "ready");

  const msLeft = upgradingBuilding?.upgrade_complete_at
    ? Math.max(0, new Date(upgradingBuilding.upgrade_complete_at).getTime() - now)
    : 0;

  const secondsLeft = Math.ceil(msLeft / 1000);
  const rushCostCoins = Math.max(1, Math.ceil(secondsLeft / 30) * 2);

  const formatDuration = (ms: number) => {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="relative min-h-[320px] overflow-hidden glass-panel border-2 border-primary/30 rounded-none p-6 sm:p-8">
        <div className="absolute inset-0 pixel-grid bg-gradient-to-r from-background via-background/90 to-background/30" />
        <div className="relative z-10 flex min-h-[280px] max-w-2xl flex-col justify-end">
          <div className="mb-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="h-20 w-20 border-4 border-primary bg-primary/20 flex items-center justify-center text-4xl shadow-glow">
                🧙‍♂️
              </div>
              <span className="absolute -bottom-2 -right-2 level-chip">LVL {level}</span>
            </div>
            <div className="min-w-0">
              <p className="game-label text-primary">Welcome back, adventurer</p>
              <h2 className="panel-title mt-1 text-xl sm:text-2xl text-white">Pathfinder Realm</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Your village grows stronger as you complete real-world quests.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4">
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
              <span className="font-bold text-white uppercase">LEVEL {level} XP PROGRESS</span>
              <span className="text-primary font-mono font-bold">
                {xp.toLocaleString()} / {total.toLocaleString()} XP ({progress}%)
              </span>
            </div>
            <div className="progress-track h-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="progress-fill" />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground text-right">
              {(total - xp).toLocaleString()} XP remaining to level up
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Construction Queue & Category Streaks */}
      <div className="grid gap-6 xl:grid-cols-[1.45fr_.9fr]">
        <div className="space-y-6">
          {/* Construction Queue Widget */}
          <section className="glass-panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b-2 border-border p-5">
              <div className="min-w-0">
                <p className="game-label">
                  Village Builder Queue • {upgradingBuilding ? "1/1 Active" : "0/1 Active"}
                </p>
                <h2 className="panel-title mt-1 truncate text-base text-white">
                  {upgradingBuilding
                    ? `${upgradingBuilding.type.toUpperCase()} · Upgrading to Level ${upgradingBuilding.level + 1}`
                    : readyBuilding
                    ? `${readyBuilding.type.toUpperCase()} · Ready for Level ${readyBuilding.level + 1} Upgrade!`
                    : "All builders idle"}
                </h2>
              </div>
              <div className="block-raised bg-reward/10 p-2 text-reward">
                <Hammer className="h-6 w-6" />
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-muted-foreground text-xs font-semibold">
                    {upgradingBuilding
                      ? "Construction in progress"
                      : readyBuilding
                      ? "Building XP threshold reached!"
                      : "Complete category tasks to gain building XP"}
                  </span>
                  {upgradingBuilding && (
                    <strong className="panel-title text-sm text-reward font-mono">
                      {formatDuration(msLeft)}
                    </strong>
                  )}
                </div>

                <div className="progress-track">
                  <motion.div
                    className="h-full bg-reward"
                    initial={false}
                    animate={{
                      width: upgradingBuilding ? `${Math.min(100, 100 - (msLeft / (upgradingBuilding.level * 120000)) * 100)}%` : readyBuilding ? "100%" : "0%",
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Linked building tasks accelerate construction XP gains.
                </p>
              </div>

              {upgradingBuilding ? (
                msLeft <= 0 ? (
                  <Button variant="reward" onClick={() => completeUpgrade(upgradingBuilding.id)}>
                    ✨ Complete
                  </Button>
                ) : (
                  <Button
                    variant="reward"
                    disabled={coins < rushCostCoins}
                    onClick={() => rushUpgrade(upgradingBuilding.id)}
                  >
                    <Zap className="h-4 w-4 mr-1" /> Rush · {rushCostCoins} Coins
                  </Button>
                )
              ) : readyBuilding ? (
                <Button variant="reward" onClick={() => startUpgrade(readyBuilding.id)}>
                  🚀 Start Upgrade
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/buildings">Village View</Link>
                </Button>
              )}
            </div>
          </section>

          {/* Category Streaks */}
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="game-label">Momentum</p>
                <h2 className="panel-title mt-1 text-lg text-white">Category Streaks</h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {["Study", "Exercise", "Work", "Personal", "Gym"].map((catName) => {
                const Icon = streakIcons[catName] || Flame;
                const streakObj = streaks.find((s) => s.category.toLowerCase() === catName.toLowerCase());
                const days = streakObj?.current_streak ?? 0;
                const freezeAvailable = streakObj?.freeze_available ?? false;

                return (
                  <motion.article whileHover={{ y: -2 }} key={catName} className="glass-panel p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className={`block-raised px-2 py-0.5 text-[9px] font-bold ${
                        days >= 3 ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {days >= 3 ? "BONUS ACTIVE" : "NEED 3+ DAYS"}
                      </span>
                    </div>

                    <div className="flex items-end gap-2">
                      <strong className="panel-title text-xl text-white">{days}</strong>
                      <span className="mb-0.5 text-xs text-muted-foreground">day {catName} streak</span>
                    </div>

                    <div className="flex gap-1">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 flex-1 ${i < Math.min(days, 7) ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={!freezeAvailable}
                      onClick={() => useFreeze(catName.toLowerCase())}
                    >
                      <Snowflake className="h-3 w-3 mr-1" /> {freezeAvailable ? "Freeze Streak" : "Frozen"}
                    </Button>
                  </motion.article>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Daily Quests & Next Up Tasks */}
        <div className="space-y-6">
          {/* Daily Quests */}
          <section className="glass-panel flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-border p-5">
              <div>
                <p className="game-label">Daily Assigned Quests</p>
                <h2 className="panel-title mt-1 text-base text-white">Daily Quests</h2>
              </div>
              <Flame className="h-5 w-5 text-reward" />
            </div>

            <ul className="space-y-3 p-5">
              {quests.map((quest) => {
                const isCompleted = quest.status === "completed";
                return (
                  <li key={quest.id} className="block-inset bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-white">{quest.task_template}</span>
                      <span className="text-xs font-bold text-reward">+{quest.bonus_xp} XP</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Status: {isCompleted ? "Completed ✓" : "Pending"}
                      </span>
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "reward"}
                        disabled={isCompleted}
                        onClick={() => claimQuest(quest.id)}
                      >
                        {isCompleted ? <Check className="h-4 w-4 mr-1" /> : <Gift className="h-4 w-4 mr-1" />}
                        {isCompleted ? "Claimed" : "Claim"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Next Up Tasks */}
          <section className="glass-panel">
            <div className="flex items-center justify-between border-b-2 border-border p-5">
              <h2 className="panel-title text-base text-white">Next Up Quests</h2>
              <Link href="/tasks" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Quest board <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <ul className="divide-y-2 divide-border">
              {openQuests.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.category} • Verification: {task.verification_type || "standard"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/tasks">Verify ⚔️</Link>
                  </Button>
                </li>
              ))}

              {openQuests.length === 0 && (
                <li className="p-4 text-sm text-muted-foreground text-center">
                  Every active quest is complete! Create a new quest on the board.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
