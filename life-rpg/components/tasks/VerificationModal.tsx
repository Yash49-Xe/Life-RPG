"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Task } from "@/types/database.types";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onStartTimer: (taskId: string, minDurationSeconds: number) => Promise<void>;
  onCompleteWithVerification: (
    taskId: string,
    payload: {
      photoData?: string;
      mimeType?: string;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    }
  ) => Promise<void>;
}

export function VerificationModal({
  isOpen,
  onClose,
  task,
  onStartTimer,
  onCompleteWithVerification,
}: VerificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [gpsData, setGpsData] = useState<{ latitude?: number; longitude?: number; accuracy?: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [timerElapsed, setTimerElapsed] = useState<number>(0);

  // Calculate live elapsed timer for study tasks
  useEffect(() => {
    if (!task?.started_at) {
      setTimerElapsed(0);
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(task.started_at!).getTime();
      const now = Date.now();
      setTimerElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [task?.started_at]);

  if (!task) return null;

  const categoryLower = task.category.toLowerCase();
  const vType = task.verification_type || (
    categoryLower === "study" || categoryLower === "focus"
      ? "timer"
      : categoryLower === "exercise" || categoryLower === "workout"
      ? "photo"
      : categoryLower === "gym" || categoryLower === "fitness"
      ? "gps"
      : "none"
  );

  const minDuration = task.min_duration_seconds || 60;
  const timerReady = timerElapsed >= minDuration;

  // Handle Photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPhotoPreview(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle GPS location acquisition
  const handleAcquireLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setGpsError(err.message || "Failed to acquire location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCompleteTask = async () => {
    setLoading(true);
    try {
      if (vType === "photo") {
        await onCompleteWithVerification(task.id, {
          photoData: photoPreview || undefined,
          mimeType,
        });
      } else if (vType === "gps") {
        await onCompleteWithVerification(task.id, {
          latitude: gpsData?.latitude,
          longitude: gpsData?.longitude,
          accuracy: gpsData?.accuracy,
        });
      } else {
        await onCompleteWithVerification(task.id, {});
      }
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl border border-white/10"
            role="dialog"
            aria-labelledby="verify-modal-title"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Verification Required ({vType.toUpperCase()})
                </span>
                <h3 id="verify-modal-title" className="text-xl font-bold text-white mt-0.5">
                  {task.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* ── TIMER VERIFICATION (Study / Focus) ────────────────────────── */}
            {vType === "timer" && (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/30 text-4xl text-indigo-400">
                  ⏱️
                </div>

                {!task.started_at ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-300">
                      This Study/Focus task requires a server-tracked session of at least{" "}
                      <span className="font-semibold text-white">{minDuration} seconds</span>.
                    </p>
                    <button
                      onClick={() => onStartTimer(task.id, minDuration)}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-semibold text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      ▶️ Start Focus Timer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-900/80 p-4 border border-white/5">
                      <div className="text-xs uppercase text-slate-400 font-semibold mb-1">Elapsed Time</div>
                      <div className="text-4xl font-black text-indigo-300 font-mono">
                        {Math.floor(timerElapsed / 60)}m {timerElapsed % 60}s
                      </div>
                      <div className="mt-2 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${Math.min(100, (timerElapsed / minDuration) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Target: {minDuration}s ({Math.max(0, minDuration - timerElapsed)}s remaining)
                      </p>
                    </div>

                    <button
                      disabled={!timerReady || loading}
                      onClick={handleCompleteTask}
                      className={`w-full rounded-xl py-3 font-semibold transition-all shadow-lg cursor-pointer ${
                        timerReady
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {loading ? "Completing..." : timerReady ? "Check & Complete Task 🚀" : "Timer in Progress..."}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── PHOTO VERIFICATION (Exercise) ──────────────────────────────── */}
            {vType === "photo" && (
              <div className="py-6 space-y-4">
                <p className="text-sm text-slate-300">
                  Upload a photo of your exercise/workout setup. Our server-side Gemini AI will verify your activity.
                </p>

                <div className="relative rounded-xl border-2 border-dashed border-white/20 p-4 text-center hover:border-indigo-500 transition-colors bg-slate-900/40">
                  {photoPreview ? (
                    <div className="space-y-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Workout Verification Preview"
                        className="mx-auto max-h-48 rounded-lg object-cover border border-white/10"
                      />
                      <button
                        onClick={() => setPhotoPreview(null)}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block space-y-2">
                      <div className="text-3xl">📷</div>
                      <div className="text-sm font-semibold text-indigo-400">Click to upload workout photo</div>
                      <div className="text-xs text-slate-500">Supports JPG, PNG (Max 5MB)</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <button
                  disabled={loading}
                  onClick={handleCompleteTask}
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-semibold text-white transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {loading ? "Verifying with Gemini AI..." : photoPreview ? "Submit Photo & Verify ✨" : "Complete Task (No Photo — 50% XP)"}
                </button>
              </div>
            )}

            {/* ── GPS VERIFICATION (Gym) ──────────────────────────────────────── */}
            {vType === "gps" && (
              <div className="py-6 space-y-4">
                <p className="text-sm text-slate-300">
                  Acquire browser GPS location to verify your gym location plausibility.
                </p>

                <div className="rounded-xl bg-slate-900/80 p-4 border border-white/10 space-y-3">
                  {gpsData ? (
                    <div className="space-y-1 text-sm">
                      <div className="text-emerald-400 font-semibold flex items-center gap-2">
                        <span>📍 Location Acquired</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Lat: {gpsData.latitude?.toFixed(4)}, Lng: {gpsData.longitude?.toFixed(4)} (Accuracy: {gpsData.accuracy?.toFixed(0)}m)
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      {gpsError ? (
                        <p className="text-xs text-rose-400 mb-2">{gpsError}</p>
                      ) : (
                        <p className="text-xs text-slate-400 mb-2">No location acquired yet.</p>
                      )}
                      <button
                        onClick={handleAcquireLocation}
                        disabled={loading}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-indigo-300 border border-indigo-500/30 cursor-pointer"
                      >
                        {loading ? "Acquiring GPS..." : "📍 Get Browser Geolocation"}
                      </button>
                    </div>
                  )}
                </div>

                <button
                  disabled={loading}
                  onClick={handleCompleteTask}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-semibold text-white transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  {loading ? "Completing..." : gpsData ? "Submit Location & Complete 🏆" : "Complete Task (Skip GPS — 50% XP)"}
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/5 text-center">
              <span className="text-xs text-slate-500">
                Life RPG Verification Engine • Server-side Protected
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
