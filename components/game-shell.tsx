"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Castle,
  CheckSquare2,
  Home,
  Menu,
  Shield,
  Sparkles,
  UserRound,
  X,
  Coins,
  Gem,
  Trophy,
  LogOut,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GameProvider, useGame } from "@/components/game-provider";
import { logout } from "@/app/actions/auth";

const navLinks = [
  { href: "/", label: "Command Center", icon: Home },
  { href: "/tasks", label: "Quest Board", icon: CheckSquare2 },
  { href: "/buildings", label: "My Village", icon: Castle },
  { href: "/character", label: "Character", icon: UserRound },
  { href: "/guild", label: "Guild Hall", icon: Shield },
] as const;

function ShellInner({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { level, xp, coins, announcement, levelUp, dismissLevelUp } = useGame();
  const activeLabel = navLinks.find((link) => link.href === pathname)?.label ?? "Life RPG";

  const nextLevelXp = Math.floor(100 * Math.pow(level, 1.5));
  const xpPct = Math.min(100, Math.floor((xp / nextLevelXp) * 100));

  const navContent = (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-border px-5">
        <div className="brand-gem">
          <Sparkles />
        </div>
        <div>
          <div className="font-bold tracking-wider text-foreground">LIFE RPG</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            Gamified Task Realm
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`nav-item ${isActive ? "nav-item-active" : ""}`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />}
            </Link>
          );
        })}
      </nav>

      {/* User Status Footer Card */}
      <div className="m-3 mb-6 glass-panel p-3 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/20 text-xl font-black text-primary border border-primary/40">
              🧙‍♂️
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">Adventurer</p>
              <p className="text-[10px] text-muted-foreground">Level {level} Pathfinder</p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              title="Sign out"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-md border border-border transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>

        <div className="progress-track h-2">
          <div className="progress-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
          <span>{xp} XP</span>
          <span>{nextLevelXp} XP</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar/90 backdrop-blur-xl lg:flex lg:flex-col">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-overlay lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-4"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Realm / Overview
              </p>
              <h1 className="font-bold text-lg text-white">{activeLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="currency-chip" aria-label={`${coins} coins`}>
              <Coins className="h-4 w-4" /> <strong>{coins}</strong>
              <span className="hidden md:inline">coins</span>
            </div>
            <div className="level-chip flex">LVL {level}</div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-border bg-sidebar/95 backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[9px] font-bold uppercase ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">
                {label.replace("Command Center", "Home").replace("Quest Board", "Quests").replace("My Village", "Village").replace("Guild Hall", "Guild")}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Level-Up Celebration Modal */}
      <AnimatePresence>
        {levelUp !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-overlay p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="level-up-title"
          >
            <div className="level-celebration glass-panel w-full max-w-md p-7 text-center border-2 border-yellow-500/50 shadow-2xl">
              <Trophy className="mx-auto h-14 w-14 text-yellow-400" />
              <p className="game-label mt-4 text-yellow-400">New Power Unlocked</p>
              <h2 id="level-up-title" className="panel-title mt-2 text-3xl font-black text-white">
                LEVEL {levelUp}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Your legend grows! Your character stats and building potential have advanced.
              </p>
              <Button
                variant="reward"
                className="mt-6 w-full py-3 text-sm font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-950 cursor-pointer"
                onClick={dismissLevelUp}
              >
                Claim Glory & Continue ⚔️
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}

export function GameShell({ children }: { children: ReactNode }) {
  return (
    <GameProvider>
      <ShellInner>{children}</ShellInner>
    </GameProvider>
  );
}
