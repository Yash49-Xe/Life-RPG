"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Task, Building, Streak, DailyQuest, Guild, Profile, Character } from "@/types/database.types";
import { xpRequiredForLevel } from "@/lib/leveling";

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  level: number;
  xp: number;
  rank: number;
}

interface GameContextValue {
  now: number;
  level: number;
  xp: number;
  coins: number;
  profile: Profile | null;
  tasks: Task[];
  buildings: Building[];
  streaks: Streak[];
  quests: DailyQuest[];
  guild: Guild | null;
  guildMembers: LeaderboardEntry[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  announcement: string;
  levelUp: number | null;
  dismissLevelUp: () => void;
  refreshState: () => Promise<void>;
  completeTask: (
    taskId: string,
    payload?: { photoData?: string; mimeType?: string; latitude?: number; longitude?: number; accuracy?: number }
  ) => Promise<boolean>;
  addTask: (title: string, category: string, minDurationSeconds?: number) => Promise<boolean>;
  startTimer: (taskId: string, minDurationSeconds?: number) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  updateGymLocation: (latitude: number, longitude: number, name?: string) => Promise<boolean>;
  startUpgrade: (buildingId: string) => Promise<boolean>;
  completeUpgrade: (buildingId: string) => Promise<boolean>;
  rushUpgrade: (buildingId: string) => Promise<boolean>;
  claimQuest: (questId: string) => Promise<boolean>;
  useFreeze: (category: string) => Promise<boolean>;
  createGuild: (name: string) => Promise<boolean>;
  joinGuild: (code: string) => Promise<boolean>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());
  const [character, setCharacter] = useState<Character | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<LeaderboardEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [levelUp, setLevelUp] = useState<number | null>(null);

  // Live timer tick
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Fetch full live game state from Supabase DB
  const refreshState = useCallback(async () => {
    try {
      const [tasksRes, buildingsRes, streaksRes, questsRes, leaderboardRes, guildRes, gymRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/buildings"),
        fetch("/api/streaks"),
        fetch("/api/quests"),
        fetch("/api/leaderboard"),
        fetch("/api/guilds"),
        fetch("/api/user/gym-location"),
      ]);

      if (tasksRes.ok) {
        const resJson = await tasksRes.json();
        setTasks(resJson.data || []);
      }
      if (buildingsRes.ok) {
        const resJson = await buildingsRes.json();
        setBuildings(resJson.data || []);
      }
      if (streaksRes.ok) {
        const resJson = await streaksRes.json();
        setStreaks(resJson.data || []);
      }
      if (questsRes.ok) {
        const resJson = await questsRes.json();
        setQuests(resJson.data || []);
      }
      if (leaderboardRes.ok) {
        const resJson = await leaderboardRes.json();
        const ldrList = resJson.data || [];
        setLeaderboard(ldrList);
        if (ldrList.length > 0) {
          setCharacter({
            user_id: ldrList[0].user_id,
            level: ldrList[0].level,
            xp: ldrList[0].xp,
            attributes: { strength: 10, intelligence: 12, endurance: 8, creativity: 9 },
          });
        }
      }
      if (guildRes.ok) {
        const resJson = await guildRes.json();
        const gObj = resJson.data || null;
        setGuild(gObj);
        if (gObj?.id) {
          const gLdrRes = await fetch(`/api/guilds/${gObj.id}/leaderboard`);
          if (gLdrRes.ok) {
            const gData = await gLdrRes.json();
            setGuildMembers(gData.data || []);
          }
        }
      }
      if (gymRes.ok) {
        const resJson = await gymRes.json();
        const profileData = resJson.data || resJson;
        setProfile({
          id: profileData.id || "",
          email: profileData.email || "",
          coins: typeof profileData.coins === "number" ? profileData.coins : 0,
          created_at: profileData.created_at || "",
          gym_latitude: profileData.gym_latitude ?? null,
          gym_longitude: profileData.gym_longitude ?? null,
          gym_name: profileData.gym_name ?? "My Gym",
        });
      }
    } catch (err) {
      console.error("[GameProvider] Failed to refresh state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Complete Task with Verification Pipeline
  const completeTask = useCallback(
    async (
      taskId: string,
      payload: { photoData?: string; mimeType?: string; latitude?: number; longitude?: number; accuracy?: number } = {}
    ) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const resJson = await res.json();
        if (!res.ok) {
          setAnnouncement(`❌ ${resJson.error || "Completion failed"}`);
          return false;
        }

        const data = resJson.data || resJson;

        if (data.character) {
          setCharacter(data.character);
          if (data.leveledUp) {
            setLevelUp(data.character.level);
          }
        }

        if (data.totalCoins !== undefined) {
          setProfile((prev) => (prev ? { ...prev, coins: data.totalCoins } : null));
        }

        const msg = data.verification?.isPartialXp
          ? `⚠️ Flagged Verification: Granted +${data.xpAwarded} partial XP & +${data.coinsEarned} coins.`
          : `✨ Task Complete! +${data.xpAwarded} XP & +${data.coinsEarned} coins.`;

        setAnnouncement(msg);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Error completing task"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Add Task
  const addTask = useCallback(
    async (title: string, category: string, minDurationSeconds: number = 60) => {
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            min_duration_seconds: minDurationSeconds,
          }),
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to create task");

        const newTask = resJson.data || resJson.task;
        if (newTask) {
          setTasks((prev) => [newTask, ...prev]);
        }

        setAnnouncement(`📋 Added quest '${title}' to board.`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Task creation error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Start Study Timer
  const startTimer = useCallback(
    async (taskId: string, minDurationSeconds: number = 60) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minDurationSeconds }),
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to start timer");

        const updatedTask = resJson.data?.task || resJson.task;
        if (updatedTask) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
        }

        setAnnouncement(`⏱️ Started session for quest.`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Timer error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Delete Task
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");

        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setAnnouncement("🗑️ Quest removed from board.");
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Delete error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Start Upgrade
  const startUpgrade = useCallback(
    async (buildingId: string) => {
      try {
        const res = await fetch(`/api/buildings/${buildingId}/start-upgrade`, {
          method: "POST",
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to start upgrade");

        setAnnouncement(`🔨 Construction started on building.`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Start upgrade error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Complete Upgrade
  const completeUpgrade = useCallback(
    async (buildingId: string) => {
      try {
        const res = await fetch(`/api/buildings/${buildingId}/complete-upgrade`, {
          method: "POST",
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to complete upgrade");

        setAnnouncement(`✨ Building upgraded to Level ${resJson.data?.building?.level || ""}`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Complete upgrade error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Rush Upgrade
  const rushUpgrade = useCallback(
    async (buildingId: string) => {
      try {
        const res = await fetch(`/api/buildings/${buildingId}/rush`, {
          method: "POST",
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to rush upgrade");

        setAnnouncement("⚡ Upgrade fast-forwarded with coins!");
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Rush error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Claim Daily Quest
  const claimQuest = useCallback(
    async (questId: string) => {
      try {
        const res = await fetch(`/api/quests/${questId}/complete`, {
          method: "POST",
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Quest completion failed");

        setAnnouncement(`🎯 Quest reward claimed! +${resJson.data?.bonusXp || 30} Bonus XP awarded!`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Quest error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Freeze Streak
  const useFreeze = useCallback(
    async (category: string) => {
      try {
        const res = await fetch(`/api/streaks/${category}/freeze`, {
          method: "POST",
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to freeze streak");

        setAnnouncement(`❄️ Streak frozen for ${category}!`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Freeze error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Create Guild
  const createGuild = useCallback(
    async (name: string) => {
      try {
        const res = await fetch("/api/guilds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to create guild");

        const g = resJson.data?.guild || resJson.guild;
        setAnnouncement(`⚜️ Founded guild '${g?.name}'! Join code: ${g?.join_code}`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Guild error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Join Guild
  const joinGuild = useCallback(
    async (code: string) => {
      try {
        const res = await fetch("/api/guilds/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ joinCode: code }),
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to join guild");

        const g = resJson.data?.guild || resJson.guild;
        setAnnouncement(`⚜️ Joined guild '${g?.name}'!`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Join error"}`);
        return false;
      }
    },
    [refreshState]
  );

  // Update Default Gym Location
  const updateGymLocation = useCallback(
    async (latitude: number, longitude: number, name: string = "My Gym") => {
      try {
        const res = await fetch("/api/user/gym-location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, name }),
        });

        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || "Failed to update gym location");

        setAnnouncement(`📍 Saved default Gym location: '${name}'`);
        await refreshState();
        return true;
      } catch (err: unknown) {
        setAnnouncement(`❌ ${err instanceof Error ? err.message : "Gym location error"}`);
        return false;
      }
    },
    [refreshState]
  );

  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  const level = character?.level ?? (leaderboard[0]?.level || 1);
  const xp = character?.xp ?? (leaderboard[0]?.xp || 0);
  const coins = profile?.coins ?? 0;

  const value = useMemo(
    () => ({
      now,
      level,
      xp,
      coins,
      profile,
      tasks,
      buildings,
      streaks,
      quests,
      guild,
      guildMembers,
      leaderboard,
      loading,
      announcement,
      levelUp,
      dismissLevelUp,
      refreshState,
      completeTask,
      addTask,
      startTimer,
      deleteTask,
      updateGymLocation,
      startUpgrade,
      completeUpgrade,
      rushUpgrade,
      claimQuest,
      useFreeze,
      createGuild,
      joinGuild,
    }),
    [
      now,
      level,
      xp,
      coins,
      profile,
      tasks,
      buildings,
      streaks,
      quests,
      guild,
      guildMembers,
      leaderboard,
      loading,
      announcement,
      levelUp,
      dismissLevelUp,
      refreshState,
      completeTask,
      addTask,
      startTimer,
      deleteTask,
      updateGymLocation,
      startUpgrade,
      completeUpgrade,
      rushUpgrade,
      claimQuest,
      useFreeze,
      createGuild,
      joinGuild,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used within GameProvider");
  return value;
}
