"use client";

import { useState } from "react";
import type { Guild } from "@/types/database.types";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  level: number;
  xp: number;
  rank: number;
}

interface GuildClientProps {
  initialLeaderboard: LeaderboardEntry[];
  userGuild: Guild | null;
  guildLeaderboard: LeaderboardEntry[];
}

export function GuildClient({
  initialLeaderboard,
  userGuild: initialUserGuild,
  guildLeaderboard: initialGuildLeaderboard,
}: GuildClientProps) {
  const [activeTab, setActiveTab] = useState<"global" | "guild">("global");
  const [userGuild, setUserGuild] = useState<Guild | null>(initialUserGuild);
  const [guildMembers, setGuildMembers] = useState<LeaderboardEntry[]>(initialGuildLeaderboard);
  const [globalLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);

  // Guild Form States
  const [guildName, setGuildName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const announce = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Create Guild
  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: guildName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create guild");

      setUserGuild(data.guild);
      announce(`⚜️ Guild '${data.guild.name}' created! Join code: ${data.guild.join_code}`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Guild error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Join Guild
  const handleJoinGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/guilds/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join guild");

      setUserGuild(data.guild);
      announce(`⚜️ Joined guild '${data.guild.name}'!`);
    } catch (err: unknown) {
      announce(`❌ ${err instanceof Error ? err.message : "Join error"}`);
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

      {/* Header & Tabs */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Rankings & Alliance
          </span>
          <h2 className="text-3xl font-black text-white mt-1">
            Guilds & Leaderboard ⚜️
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Compete on the global level or form a guild with friends to climb together.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("global")}
            className={`px-5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "global"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🌍 Global Ranks
          </button>
          <button
            onClick={() => setActiveTab("guild")}
            className={`px-5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "guild"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚜️ Guild Center
          </button>
        </div>
      </div>

      {/* ── GLOBAL LEADERBOARD TAB ────────────────────────────────────────── */}
      {activeTab === "global" && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏆</span> Top Adventurers
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-white/10 bg-slate-900/40">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Adventurer</th>
                  <th className="p-3">Level</th>
                  <th className="p-3 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {globalLeaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankBadge =
                    rank === 1 ? "🥇 #1" : rank === 2 ? "🥈 #2" : rank === 3 ? "🥉 #3" : `#${rank}`;

                  return (
                    <tr key={entry.user_id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                          rank === 1 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                          rank === 2 ? "bg-slate-300/20 text-slate-200 border border-slate-300/40" :
                          rank === 3 ? "bg-orange-500/20 text-orange-300 border border-orange-500/40" : "text-slate-400"
                        }`}>
                          {rankBadge}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        {entry.display_name}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-amber-300">Lvl {entry.level}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-indigo-300">
                        {entry.xp} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GUILD CENTER TAB ─────────────────────────────────────────────── */}
      {activeTab === "guild" && (
        <div className="space-y-6">
          {!userGuild ? (
            /* Create / Join Guild Options */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Guild */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-2xl text-indigo-400">
                    🏛️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Form a New Guild</h3>
                    <p className="text-xs text-slate-400">Create an alliance and receive a shareable join code</p>
                  </div>
                </div>

                <form onSubmit={handleCreateGuild} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Guild Name (e.g. Iron Legion)"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    className="w-full rounded-xl bg-slate-900/80 border border-white/10 p-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    {loading ? "Creating..." : "Create Guild ⚔️"}
                  </button>
                </form>
              </div>

              {/* Join Guild */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-2xl text-purple-400">
                    🔑
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Join an Existing Guild</h3>
                    <p className="text-xs text-slate-400">Enter a 6-character guild join code</p>
                  </div>
                </div>

                <form onSubmit={handleJoinGuild} className="space-y-3">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Join Code (e.g. AB12CD)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl bg-slate-900/80 border border-white/10 p-3 text-sm font-mono text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-400 uppercase tracking-widest"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 py-3 font-bold text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    {loading ? "Joining..." : "Join Guild 🚀"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Active Guild View & Guild Ranks */
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Active Alliance</span>
                  <h3 className="text-2xl font-black text-white mt-0.5">{userGuild.name}</h3>
                  <p className="text-xs text-slate-400">Founded on {new Date(userGuild.created_at).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-900/80 p-3 border border-white/10">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Join Code</div>
                    <div className="text-lg font-mono font-bold text-amber-300 tracking-widest">{userGuild.join_code}</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(userGuild.join_code);
                      announce("Copied Join Code to clipboard!");
                    }}
                    className="rounded-lg bg-slate-800 p-2 text-xs text-indigo-300 hover:text-white border border-indigo-500/30 cursor-pointer"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {/* Guild Members Leaderboard */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚜️</span> Guild Member Ranks
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400 border-b border-white/10 bg-slate-900/40">
                      <tr>
                        <th className="p-3">Rank</th>
                        <th className="p-3">Member</th>
                        <th className="p-3">Level</th>
                        <th className="p-3 text-right">Total XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {guildMembers.map((member, idx) => (
                        <tr key={member.user_id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                          <td className="p-3 font-semibold text-white">{member.display_name}</td>
                          <td className="p-3 font-bold text-amber-300">Lvl {member.level}</td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-300">{member.xp} XP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
