"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, DailyQuest } from "@/types/database.types";
import { VerificationModal } from "@/components/tasks/VerificationModal";
import { LevelUpModal } from "@/components/ui/LevelUpModal";

interface TasksClientProps {
  initialTasks: Task[];
  initialQuests: DailyQuest[];
}

export function TasksClient({ initialTasks, initialQuests }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [quests, setQuests] = useState<DailyQuest[]>(initialQuests);
  const [filter, setFilter] = useState<string>("all");
  
  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Study");
  const [minDuration, setMinDuration] = useState(60);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Toast / Announcement State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Verification Modal State
  const [verifyingTask, setVerifyingTask] = useState<Task | null>(null);

  // Level Up Modal State
  const [levelUpData, setLevelUpData] = useState<{
    isOpen: boolean;
    newLevel: number;
    levelsGained: number;
    xpAwarded: number;
  }>({
    isOpen: false,
    newLevel: 1,
    levelsGained: 1,
    xpAwarded: 0,
  });

  const announce = (msg: string) => {
    setToastMessage(msg);
    const el = document.getElementById("game-announcer");
    if (el) el.textContent = msg;
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          min_duration_seconds: category.toLowerCase() === "study" ? minDuration : 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setShowCreateModal(false);
      announce(`✨ Created task: ${data.task.title}`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Creation error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      announce("Task deleted");
    } catch {
      announce("Failed to delete task");
    }
  };

  // Start Timer Session for Study Task
  const handleStartTimer = async (taskId: string, durationSec: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minDurationSeconds: durationSec }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start timer");

      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      setVerifyingTask(data.task);
      announce(`⏱️ Timer started for ${data.task.title}`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Timer error"}`);
    }
  };

  // Complete Task Trigger (Optimistic UI + Modal routing)
  const handleCompleteClick = (task: Task) => {
    const catLower = task.category.toLowerCase();
    const isVerificationNeeded =
      task.verification_type === "photo" ||
      task.verification_type === "gps" ||
      task.verification_type === "timer" ||
      catLower === "study" ||
      catLower === "exercise" ||
      catLower === "gym";

    if (isVerificationNeeded) {
      setVerifyingTask(task);
    } else {
      executeCompleteTask(task.id, {});
    }
  };

  // Execute Task Completion API with Optimistic Rollback
  const executeCompleteTask = async (
    taskId: string,
    payload: {
      photoData?: string;
      mimeType?: string;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    }
  ) => {
    // Save snapshot for optimistic rollback
    const originalTasks = [...tasks];

    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: "completed", completed_at: new Date().toISOString() }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // Rollback Optimistic UI state
        setTasks(originalTasks);
        throw new Error(data.error || "Completion failed");
      }

      // Update confirmed task state
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));

      // Announce result
      const xpMsg = data.verification?.isPartialXp
        ? `⚠️ Flagged: Granted Partial +${data.xpAwarded} XP`
        : `🏆 Task Complete! +${data.xpAwarded} XP & +${data.coinsEarned} Coins`;

      announce(xpMsg);

      // Trigger Level-Up modal if threshold reached
      if (data.leveledUp) {
        setLevelUpData({
          isOpen: true,
          newLevel: data.character.level,
          levelsGained: data.levelsGained || 1,
          xpAwarded: data.xpAwarded,
        });
      }
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Task completion error"}`);
    }
  };

  // Complete Daily Quest
  const handleCompleteQuest = async (questId: string) => {
    try {
      const res = await fetch(`/api/quests/${questId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Quest completion failed");

      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, status: "completed" } : q))
      );
      announce(`🎯 Quest Completed! +${data.bonusXp} Bonus XP awarded!`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Quest error"}`);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return t.status === "pending";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={levelUpData.isOpen}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
        newLevel={levelUpData.newLevel}
        levelsGained={levelUpData.levelsGained}
        xpAwarded={levelUpData.xpAwarded}
      />

      {/* Task Verification Modal */}
      <VerificationModal
        isOpen={!!verifyingTask}
        onClose={() => setVerifyingTask(null)}
        task={verifyingTask}
        onStartTimer={handleStartTimer}
        onCompleteWithVerification={executeCompleteTask}
      />

      {/* Floating Announcement Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 p-4 shadow-2xl text-sm font-semibold text-white flex items-center gap-3 max-w-sm"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Quests & Task Board
          </span>
          <h2 className="text-3xl font-black text-white mt-1">
            Task Management 📋
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Complete tasks with server-side verification to earn XP, coins, and advance your village.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm cursor-pointer"
        >
          + Create New Task
        </button>
      </div>

      {/* Daily Quests Section */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Quests</h3>
              <p className="text-xs text-amber-400">Bonus XP resets daily at midnight UTC</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className="glass-card p-4 rounded-xl border border-amber-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-300">Daily Quest</span>
                <span className="rounded-full bg-amber-500/20 text-amber-300 px-2.5 py-0.5 text-xs font-black border border-amber-500/40 animate-pulse-glow">
                  +{quest.bonus_xp} XP
                </span>
              </div>
              <p className="text-sm font-bold text-white">{quest.task_template}</p>

              {quest.status === "completed" ? (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span>✓ Completed</span>
                </div>
              ) : (
                <button
                  onClick={() => handleCompleteQuest(quest.id)}
                  className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 py-1.5 text-xs font-bold text-slate-950 transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Claim Quest Reward 🎯
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tasks List Header & Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h3 className="text-xl font-bold text-white">Your Tasks</h3>
          </div>

          <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/10 text-xs">
            {["all", "pending", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                  filter === f
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl">
              <span className="text-4xl block mb-2">📜</span>
              <p className="text-sm">No tasks found for this filter.</p>
              <p className="text-xs text-slate-500 mt-1">Create a new task above to start earning XP!</p>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isCompleted = t.status === "completed";
              const catLower = t.category.toLowerCase();
              const vType = t.verification_type || (
                catLower === "study" ? "timer" : catLower === "exercise" ? "photo" : catLower === "gym" ? "gps" : "none"
              );

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass-card p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border transition-all ${
                    isCompleted ? "border-emerald-500/30 opacity-70" : "border-white/10 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      disabled={isCompleted}
                      onClick={() => handleCompleteClick(t)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold"
                          : "border-white/20 hover:border-indigo-400 hover:bg-indigo-500/20 text-transparent hover:text-indigo-400"
                      }`}
                      aria-label={`Mark '${t.title}' as complete`}
                    >
                      ✓
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold ${isCompleted ? "line-through text-slate-400" : "text-white"}`}>
                          {t.title}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase">
                          {t.category}
                        </span>
                        {vType !== "none" && (
                          <span className="rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase">
                            🛡️ {vType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                        {t.verification_status && t.verification_status !== "unverified" && (
                          <span className={`font-semibold ${t.verification_status === "verified" ? "text-emerald-400" : "text-amber-400"}`}>
                            Status: {t.verification_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {!isCompleted ? (
                      <button
                        onClick={() => handleCompleteClick(t)}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 cursor-pointer"
                      >
                        Complete & Verify ⚔️
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400">Completed ✓</span>
                    )}

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-500 hover:text-rose-400 p-2 text-xs transition-colors cursor-pointer"
                      aria-label="Delete task"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Create New Task</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Read 20 pages of Algorithms"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/80 border border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/80 border border-white/10 p-3 text-sm text-white focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Study">Study (Timer Verification)</option>
                    <option value="Exercise">Exercise (Gemini Photo Verification)</option>
                    <option value="Gym">Gym (GPS Location Verification)</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                {category === "Study" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Min Timer Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={3600}
                      value={minDuration}
                      onChange={(e) => setMinDuration(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-900/80 border border-white/10 p-3 text-sm text-white focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer"
                >
                  {loading ? "Creating..." : "Add Task 🚀"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
