"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Clock,
  Plus,
  Trash2,
  MapPin,
  ShieldAlert,
  Camera,
  Layers,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGame } from "@/components/game-provider";
import type { Task } from "@/types/database.types";

export function TasksRoute() {
  const { tasks, completeTask, addTask, startTimer, deleteTask, profile, updateGymLocation } = useGame();

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Study");
  const [minDuration, setMinDuration] = useState(60);

  // Verification Modal State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [gpsData, setGpsData] = useState<{ latitude?: number; longitude?: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gym Location Setup/Edit State
  const [isEditingGym, setIsEditingGym] = useState(false);
  const [gymNameInput, setGymNameInput] = useState("");
  const [gymLatInput, setGymLatInput] = useState("");
  const [gymLngInput, setGymLngInput] = useState("");
  const [isSavingGym, setIsSavingGym] = useState(false);

  const hasSavedGym = profile?.gym_latitude != null && profile?.gym_longitude != null;

  // Live timer tick for active study task
  const [elapsedTimer, setElapsedTimer] = useState(0);

  useEffect(() => {
    if (!activeTask?.started_at) {
      setElapsedTimer(0);
      return;
    }

    const calcElapsed = () => {
      const start = new Date(activeTask.started_at!).getTime();
      const now = Date.now();
      setElapsedTimer(Math.max(0, Math.floor((now - start) / 1000)));
    };

    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTask?.started_at]);

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    const ok = await addTask(title.trim(), category, category.toLowerCase() === "study" ? minDuration : 60);
    setIsSubmitting(false);

    if (ok) {
      setTitle("");
      setShowCreateModal(false);
    }
  };

  const handleStartTaskDirectly = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setIsSubmitting(true);
    await startTimer(task.id, task.min_duration_seconds || 60);
    setIsSubmitting(false);
  };

  const handleTaskClick = async (task: Task) => {
    if (task.status === "completed") return;

    // Auto-start session if not started yet
    if (!task.started_at) {
      setIsSubmitting(true);
      await startTimer(task.id, task.min_duration_seconds || 60);
      setIsSubmitting(false);
    }

    const catLower = task.category.toLowerCase();
    const vType = task.verification_type || (
      catLower === "study" ? "timer" : catLower === "exercise" ? "photo" : catLower === "gym" ? "gps" : "none"
    );

    if (vType !== "none") {
      setActiveTaskId(task.id);
      setPhotoPreview(null);
      setGpsData(null);
      setGpsError(null);
      setIsEditingGym(false);
    } else {
      completeTask(task.id, {});
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPhotoPreview(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsSubmitting(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsSubmitting(false);
      },
      (err) => {
        setGpsError(err.message || "Failed to acquire location");
        setIsSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleExecuteVerification = async () => {
    if (!activeTask) return;
    setIsSubmitting(true);

    const catLower = activeTask.category.toLowerCase();
    const vType = activeTask.verification_type || (
      catLower === "study" ? "timer" : catLower === "exercise" ? "photo" : catLower === "gym" ? "gps" : "none"
    );

    let payload = {};
    if (vType === "photo") {
      payload = { photoData: photoPreview || undefined, mimeType };
    } else if (vType === "gps") {
      payload = { latitude: gpsData?.latitude, longitude: gpsData?.longitude, accuracy: gpsData?.accuracy };
    }

    const success = await completeTask(activeTask.id, payload);
    setIsSubmitting(false);

    if (success) {
      setActiveTaskId(null);
    }
  };

  // Categorize tasks into 3 equal-width Kanban columns:
  // Column 1: All Available Quests (Pending tasks without active verification)
  // Column 2: In Progress & Verification (Pending tasks with timer started or verification needed)
  // Column 3: Completed Quests (Recent 5 completed tasks with scrollbar)
  const readyTasks = tasks.filter((t) => t.status === "pending" && !t.started_at);
  const inProgressTasks = tasks.filter((t) => t.status === "pending" && t.started_at);
  const allCompletedTasks = tasks
    .filter((t) => t.status === "completed")
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime());

  const recentCompletedTasks = allCompletedTasks.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="game-label text-primary">Quest Management</p>
          <h2 className="panel-title text-2xl text-white mt-1">Quest Board 📋</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Complete quests with server-side verification to earn XP, coins, and advance your village buildings.
          </p>
        </div>

        <Button variant="reward" onClick={() => setShowCreateModal(true)} className="cursor-pointer font-bold">
          <Plus className="h-4 w-4 mr-1" /> Create Quest
        </Button>
      </div>

      {/* ── 3 EQUAL-LENGTH KANBAN COLUMNS LAYOUT ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: READY / AVAILABLE QUESTS */}
        <div className="glass-panel p-5 space-y-4 min-h-[500px] flex flex-col justify-between border-2 border-primary/40">
          <div>
            <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="panel-title text-base text-white">Ready Quests</h3>
              </div>
              <span className="level-chip">{readyTasks.length}</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {readyTasks.length === 0 ? (
                <div className="block-inset bg-muted/20 p-6 text-center text-muted-foreground text-xs">
                  No new quests ready. Click "Create Quest" to post one!
                </div>
              ) : (
                readyTasks.map((t) => {
                  const catLower = t.category.toLowerCase();
                  const vType = t.verification_type || (
                    catLower === "study" ? "timer" : catLower === "exercise" ? "photo" : catLower === "gym" ? "gps" : "none"
                  );

                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ y: -2 }}
                      className="glass-panel p-4 space-y-3 border-2 border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <span className="block-raised bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                          {t.category}
                        </span>
                        {vType !== "none" && (
                          <span className="block-raised bg-primary/10 text-primary border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> {vType}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white">{t.title}</h4>

                      <div className="flex gap-2 items-center pt-2 border-t border-border">
                        <Button
                          variant="game"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={(e) => handleStartTaskDirectly(e, t)}
                          className="text-xs font-bold flex-1 cursor-pointer"
                        >
                          ▶️ Start Quest
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTaskClick(t)}
                          className="text-xs font-bold cursor-pointer"
                        >
                          ⚔️
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(t.id)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS / VERIFICATION */}
        <div className="glass-panel p-5 space-y-4 min-h-[500px] flex flex-col justify-between border-2 border-amber-500/40">
          <div>
            <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Hourglass className="h-5 w-5 text-reward animate-spin" style={{ animationDuration: "6s" }} />
                <h3 className="panel-title text-base text-white">In Progress</h3>
              </div>
              <span className="level-chip bg-reward text-reward-foreground">{inProgressTasks.length}</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {inProgressTasks.length === 0 ? (
                <div className="block-inset bg-muted/20 p-6 text-center text-muted-foreground text-xs">
                  No active timer or verification in progress.
                </div>
              ) : (
                inProgressTasks.map((t) => {
                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ y: -2 }}
                      className="glass-panel p-4 space-y-3 border-2 border-reward/40 shadow-reward/20"
                    >
                      <div className="flex justify-between items-start">
                        <span className="block-raised bg-reward/10 text-reward border-reward/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                          Session Active
                        </span>
                        <Clock className="h-4 w-4 text-reward" />
                      </div>

                      <h4 className="font-bold text-sm text-white">{t.title}</h4>

                      <div className="pt-2 border-t border-border flex justify-between items-center gap-2">
                        <Button
                          variant="reward"
                          size="sm"
                          onClick={() => handleTaskClick(t)}
                          className="text-xs font-bold flex-1 cursor-pointer"
                        >
                          Complete Verification ⏱️
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(t.id)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3: COMPLETED QUESTS */}
        <div className="glass-panel p-5 space-y-4 min-h-[500px] flex flex-col justify-between border-2 border-success/40">
          <div>
            <div className="flex items-center justify-between border-b-2 border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <h3 className="panel-title text-base text-white">Completed Quests</h3>
              </div>
              <span className="level-chip bg-success text-slate-950">
                {allCompletedTasks.length > 5 ? `Recent 5 of ${allCompletedTasks.length}` : allCompletedTasks.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {recentCompletedTasks.length === 0 ? (
                <div className="block-inset bg-muted/20 p-6 text-center text-muted-foreground text-xs">
                  No completed quests yet. Finish your objectives to earn XP!
                </div>
              ) : (
                recentCompletedTasks.map((t) => {
                  return (
                    <div
                      key={t.id}
                      className="glass-panel p-4 space-y-2 border-2 border-success/30 bg-success/5 opacity-80 hover:opacity-100 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-success uppercase flex items-center gap-1">
                          <Check className="h-3 w-3" /> VERIFIED & DONE
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {t.completed_at ? new Date(t.completed_at).toLocaleTimeString() : "Today"}
                          </span>
                          <button
                            onClick={() => deleteTask(t.id)}
                            title="Remove quest record"
                            className="text-muted-foreground hover:text-destructive text-xs cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-white line-through">{t.title}</h4>
                      <p className="text-[11px] text-muted-foreground">Category: {t.category}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-overlay backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md glass-panel p-6 space-y-4 border-2 border-primary/40 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="panel-title text-lg text-white">Create New Quest</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-white">✕</button>
              </div>

              <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
                <div>
                  <label className="game-label block mb-1">Quest Objective Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Read 25 pages of Systems Design"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-input border-2 border-border p-3 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="game-label block mb-1">Category & Verification Mode</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-input border-2 border-border p-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Study">Study (Timer Verification)</option>
                    <option value="Exercise">Exercise (Gemini Photo AI Verification)</option>
                    <option value="Gym">Gym (GPS Location Verification)</option>
                    <option value="Work">Work (Standard Task)</option>
                    <option value="Personal">Personal (Standard Task)</option>
                  </select>
                </div>

                {category === "Study" && (
                  <div>
                    <label className="game-label block mb-1">Min Focus Duration (Seconds)</label>
                    <input
                      type="number"
                      min={10}
                      max={3600}
                      value={minDuration}
                      onChange={(e) => setMinDuration(Number(e.target.value))}
                      className="w-full bg-input border-2 border-border p-3 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                <Button variant="reward" type="submit" disabled={isSubmitting} className="w-full py-3 font-bold text-sm">
                  {isSubmitting ? "Creating..." : "Post Quest to Board 🚀"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Verification Modal */}
      <AnimatePresence>
        {activeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTaskId(null)}
              className="absolute inset-0 bg-overlay backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-lg glass-panel p-6 space-y-4 border-2 border-primary/50 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div>
                  <p className="game-label text-primary">Verification Pipeline</p>
                  <h3 className="panel-title text-lg text-white mt-0.5">{activeTask.title}</h3>
                </div>
                <button onClick={() => setActiveTaskId(null)} className="text-muted-foreground hover:text-white">✕</button>
              </div>

              {/* ── TIMER VERIFICATION (Study) ───────────────────────────────── */}
              {(activeTask.verification_type === "timer" || activeTask.category.toLowerCase() === "study") && (
                <div className="py-4 space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-2 border-primary text-3xl text-primary">
                    <Clock className="h-8 w-8" />
                  </div>

                  {!activeTask.started_at ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        This Study quest requires a minimum server-tracked session of{" "}
                        <strong className="text-white">{activeTask.min_duration_seconds || 60} seconds</strong>.
                      </p>
                      <Button
                        variant="game"
                        disabled={isSubmitting}
                        className="w-full py-3 text-sm font-bold cursor-pointer"
                        onClick={async () => {
                          setIsSubmitting(true);
                          await startTimer(activeTask.id, activeTask.min_duration_seconds || 60);
                          setIsSubmitting(false);
                        }}
                      >
                        {isSubmitting ? "Starting Quest..." : "▶️ Start Focus Session Timer"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="glass-panel p-4">
                        <p className="game-label">Elapsed Focus Session</p>
                        <p className="font-mono text-3xl font-bold text-primary mt-1">
                          {Math.floor(elapsedTimer / 60)}m {elapsedTimer % 60}s
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Required: {activeTask.min_duration_seconds || 60}s (
                          {Math.max(0, (activeTask.min_duration_seconds || 60) - elapsedTimer)}s remaining)
                        </p>
                      </div>

                      <Button
                        variant="reward"
                        disabled={elapsedTimer < (activeTask.min_duration_seconds || 60) || isSubmitting}
                        onClick={handleExecuteVerification}
                        className="w-full py-3 text-sm font-bold"
                      >
                        {elapsedTimer < (activeTask.min_duration_seconds || 60)
                          ? "Session in Progress..."
                          : "Check Duration & Complete Quest 🏆"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ── PHOTO VERIFICATION (Exercise) ───────────────────────────── */}
              {(activeTask.verification_type === "photo" || activeTask.category.toLowerCase() === "exercise") && (
                <div className="py-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Upload a photo of your exercise setup or workout routine. Our server-side Gemini AI will verify your activity.
                  </p>

                  <div className="border-2 border-dashed border-border p-4 text-center bg-muted/20 hover:border-primary transition-colors">
                    {photoPreview ? (
                      <div className="space-y-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Workout preview"
                          className="mx-auto max-h-44 object-cover border-2 border-border"
                        />
                        <button onClick={() => setPhotoPreview(null)} className="text-xs text-destructive hover:underline">
                          Change Photo
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2 py-4">
                        <Camera className="mx-auto h-10 w-10 text-primary" />
                        <span className="text-xs font-bold text-primary block">Click to Upload Workout Photo</span>
                        <span className="text-[10px] text-muted-foreground block">JPG, PNG supported (Max 5MB)</span>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  <Button
                    variant="reward"
                    disabled={isSubmitting}
                    onClick={handleExecuteVerification}
                    className="w-full py-3 text-sm font-bold"
                  >
                    {isSubmitting
                      ? "Verifying with Gemini AI..."
                      : photoPreview
                      ? "Submit Photo & Verify ✨"
                      : "Complete Quest (No Photo — 50% XP)"}
                  </Button>
                </div>
              )}

              {/* ── GPS VERIFICATION (Gym) ───────────────────────────────────── */}
              {(activeTask.verification_type === "gps" || activeTask.category.toLowerCase() === "gym") && (
                <div className="py-4 space-y-4">
                  {hasSavedGym && !isEditingGym ? (
                    <div className="space-y-4">
                      {/* Saved Gym Info Badge */}
                      <div className="glass-panel p-4 border-2 border-primary/40 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="game-label text-primary flex items-center gap-1">
                            🏋️ Registered Gym Location
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setGymNameInput(profile?.gym_name || "My Gym");
                              setGymLatInput(profile?.gym_latitude?.toString() || "");
                              setGymLngInput(profile?.gym_longitude?.toString() || "");
                              setIsEditingGym(true);
                            }}
                            className="text-xs cursor-pointer"
                          >
                            ✏️ Change Gym Location
                          </Button>
                        </div>
                        <p className="font-bold text-sm text-white">{profile?.gym_name || "My Gym"}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          Lat: {profile?.gym_latitude?.toFixed(4)}, Lng: {profile?.gym_longitude?.toFixed(4)}
                        </p>
                      </div>

                      {/* Live GPS Check-in */}
                      <div className="glass-panel p-4 text-center space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Acquire your current location to verify you are within 300m of <strong>{profile?.gym_name || "your gym"}</strong>.
                        </p>

                        {gpsData ? (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-success flex items-center justify-center gap-1">
                              <MapPin className="h-4 w-4" /> Live Geolocation Acquired
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              Lat: {gpsData.latitude?.toFixed(4)}, Lng: {gpsData.longitude?.toFixed(4)} (Accuracy: {gpsData.accuracy?.toFixed(0)}m)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {gpsError && <p className="text-xs text-destructive">{gpsError}</p>}
                            <Button variant="outline" size="sm" onClick={handleGetLocation} disabled={isSubmitting}>
                              📍 Get Current GPS Location
                            </Button>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="reward"
                        disabled={isSubmitting || !gpsData}
                        onClick={handleExecuteVerification}
                        className="w-full py-3 text-sm font-bold"
                      >
                        {isSubmitting
                          ? "Verifying Proximity..."
                          : gpsData
                          ? "Submit Location & Verify Gym Check-in 🏆"
                          : "Acquire Location First to Verify 📍"}
                      </Button>
                    </div>
                  ) : (
                    /* Gym Setup & Edit Form */
                    <div className="space-y-4 glass-panel p-4 border-2 border-amber-500/40">
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {hasSavedGym ? "✏️ Update Gym Location" : "🏋️ Register Your Gym Location"}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Save your gym's location to automatically verify future gym check-in quests.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="game-label block mb-1">Gym Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Gold's Gym Downtown"
                            value={gymNameInput}
                            onChange={(e) => setGymNameInput(e.target.value)}
                            className="w-full bg-input border-2 border-border p-2 text-xs text-white focus:border-primary focus:outline-none"
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          className="w-full text-xs font-bold cursor-pointer"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setGymLatInput(pos.coords.latitude.toString());
                                setGymLngInput(pos.coords.longitude.toString());
                              });
                            }
                          }}
                        >
                          📍 Auto-Detect Current GPS as Gym Location
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="game-label block mb-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="25.3176"
                              value={gymLatInput}
                              onChange={(e) => setGymLatInput(e.target.value)}
                              className="w-full bg-input border-2 border-border p-2 text-xs font-mono text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="game-label block mb-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="82.9739"
                              value={gymLngInput}
                              onChange={(e) => setGymLngInput(e.target.value)}
                              className="w-full bg-input border-2 border-border p-2 text-xs font-mono text-white focus:border-primary focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="reward"
                            size="sm"
                            disabled={isSavingGym || !gymLatInput || !gymLngInput}
                            onClick={async () => {
                              setIsSavingGym(true);
                              const ok = await updateGymLocation(
                                parseFloat(gymLatInput),
                                parseFloat(gymLngInput),
                                gymNameInput || "My Gym"
                              );
                              setIsSavingGym(false);
                              if (ok) setIsEditingGym(false);
                            }}
                            className="flex-1 text-xs font-bold cursor-pointer"
                          >
                            {isSavingGym ? "Saving..." : "💾 Save Gym Location"}
                          </Button>

                          {hasSavedGym && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingGym(false)}
                              className="text-xs cursor-pointer"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
