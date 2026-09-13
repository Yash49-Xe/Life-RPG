"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  levelsGained: number;
  xpAwarded: number;
}

export function LevelUpModal({
  isOpen,
  onClose,
  newLevel,
  levelsGained,
  xpAwarded,
}: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl glass-panel p-8 text-center border border-amber-500/40 shadow-2xl shadow-amber-500/20"
            role="dialog"
            aria-labelledby="levelup-title"
            aria-modal="true"
          >
            {/* Radiant Sunburst Aura */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Icon / Emblem */}
            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-xl shadow-amber-500/40 animate-level-up">
              <span className="text-5xl select-none">👑</span>
            </div>

            <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-widest border border-amber-500/20 mb-2">
              Level Up Achieved!
            </span>

            <h2 id="levelup-title" className="text-3xl font-black text-white tracking-tight">
              LEVEL {newLevel}
            </h2>

            <p className="mt-2 text-sm text-slate-300">
              Congratulations Adventurer! You gained{" "}
              <span className="font-semibold text-amber-400">+{xpAwarded} XP</span> and advanced{" "}
              <span className="font-semibold text-amber-400">
                {levelsGained} {levelsGained === 1 ? "level" : "levels"}
              </span>!
            </p>

            <div className="mt-6 rounded-xl bg-slate-900/60 p-4 border border-white/5 flex justify-around text-center">
              <div>
                <div className="text-xs text-slate-400 uppercase">New Rank</div>
                <div className="text-base font-bold text-amber-300">
                  {newLevel >= 10 ? "Master" : newLevel >= 5 ? "Veteran" : "Apprentice"}
                </div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-xs text-slate-400 uppercase">Attribute Point</div>
                <div className="text-base font-bold text-emerald-400">+{levelsGained * 2} Stats</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-yellow-400 transition-all cursor-pointer focus:ring-2 focus:ring-amber-300"
            >
              Claim Glory ⚔️
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
