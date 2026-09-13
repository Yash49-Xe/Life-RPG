"use client";

import { useState } from "react";
import { Shield, Trophy, Users, Key, Copy, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGame } from "@/components/game-provider";

export function GuildRoute() {
  const { guild, guildMembers, leaderboard, createGuild, joinGuild } = useGame();

  const [tab, setTab] = useState<"global" | "guild">("global");
  const [guildName, setGuildName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guildName.trim()) return;

    setIsSubmitting(true);
    const ok = await createGuild(guildName.trim());
    setIsSubmitting(false);

    if (ok) {
      setGuildName("");
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsSubmitting(true);
    const ok = await joinGuild(joinCode.trim().toUpperCase());
    setIsSubmitting(false);

    if (ok) {
      setJoinCode("");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="game-label text-primary">Alliances & Ranks</p>
          <h2 className="panel-title text-2xl text-white mt-1">Guild Hall 🛡️</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Compete on the global leaderboard or form a guild with friends to advance together.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-muted/40 p-1 border border-border">
          <button
            onClick={() => setTab("global")}
            className={`tab-blocky text-xs uppercase cursor-pointer ${tab === "global" ? "tab-blocky-active font-bold" : ""}`}
          >
            🌍 Global Leaderboard
          </button>
          <button
            onClick={() => setTab("guild")}
            className={`tab-blocky text-xs uppercase cursor-pointer ${tab === "guild" ? "tab-blocky-active font-bold" : ""}`}
          >
            🛡️ Guild Hall
          </button>
        </div>
      </div>

      {/* ── GLOBAL LEADERBOARD TAB ────────────────────────────────────────── */}
      {tab === "global" && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="panel-title text-lg text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-reward" /> Top Global Adventurers
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b-2 border-border bg-muted/30">
                <tr>
                  <th className="p-3 font-bold">Rank</th>
                  <th className="p-3 font-bold">Adventurer</th>
                  <th className="p-3 font-bold">Level</th>
                  <th className="p-3 font-bold text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr key={entry.user_id || entry.display_name || `global-${idx}`} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-bold">
                        <span
                          className={`block-raised px-2.5 py-1 text-xs ${
                            rank === 1
                              ? "bg-reward/20 text-reward border-reward"
                              : rank === 2
                              ? "bg-slate-300/20 text-slate-200 border-slate-300"
                              : rank === 3
                              ? "bg-amber-600/20 text-amber-300 border-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{entry.display_name}</td>
                      <td className="p-3 font-bold text-primary">Lvl {entry.level}</td>
                      <td className="p-3 text-right font-mono font-bold text-reward">{entry.xp} XP</td>
                    </tr>
                  );
                })}

                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs text-muted-foreground">
                      No leaderboard entries yet. Complete quests to appear on the ranks!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GUILD HALL TAB ───────────────────────────────────────────────── */}
      {tab === "guild" && (
        <div className="space-y-6">
          {!guild ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Form a Guild */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="brand-gem">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="panel-title text-base text-white">Found a New Guild</h3>
                    <p className="text-xs text-muted-foreground">Establish an alliance and receive a join code</p>
                  </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Guild Name (e.g. Moonfall Wardens)"
                    value={guildName}
                    onChange={(e) => setGuildName(e.target.value)}
                    className="w-full bg-input border-2 border-border p-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                  <Button variant="reward" type="submit" disabled={isSubmitting} className="w-full py-3 font-bold text-sm">
                    {isSubmitting ? "Founding..." : "Found Guild 🛡️"}
                  </Button>
                </form>
              </div>

              {/* Join a Guild */}
              <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="brand-gem">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="panel-title text-base text-white">Join an Existing Guild</h3>
                    <p className="text-xs text-muted-foreground">Enter a guild join code to enlist</p>
                  </div>
                </div>

                <form onSubmit={handleJoin} className="space-y-3">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="Join Code (e.g. MW-4821)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-input border-2 border-border p-3 text-sm font-mono text-white tracking-widest uppercase focus:border-primary focus:outline-none"
                  />
                  <Button variant="game" type="submit" disabled={isSubmitting} className="w-full py-3 font-bold text-sm">
                    {isSubmitting ? "Enlisting..." : "Enlist in Guild 🚀"}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            /* Active Guild View */
            <div className="space-y-6">
              <div className="glass-panel p-6 border-2 border-accent/40 shadow-glow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="game-label text-accent">Active Alliance</p>
                  <h3 className="panel-title text-2xl text-white mt-0.5">{guild.name}</h3>
                  <p className="text-xs text-muted-foreground">Established in the realm</p>
                </div>

                <div className="flex items-center gap-3 block-raised bg-muted/40 p-3 border-2 border-border">
                  <div>
                    <p className="game-label text-reward">Join Code</p>
                    <p className="font-mono text-lg font-bold text-white tracking-widest">{guild.join_code}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleCopyCode(guild.join_code)}>
                    <Copy className="h-4 w-4 mr-1" /> {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* Guild Member Rankings */}
              <div className="glass-panel p-6 space-y-4">
                <h4 className="panel-title text-lg text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Guild Member Ranks
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-muted-foreground border-b-2 border-border bg-muted/30">
                      <tr>
                        <th className="p-3 font-bold">Rank</th>
                        <th className="p-3 font-bold">Member</th>
                        <th className="p-3 font-bold">Level</th>
                        <th className="p-3 font-bold text-right">Total XP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {guildMembers.map((member, idx) => (
                        <tr key={member.user_id || member.display_name || `member-${idx}`} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-bold text-muted-foreground">#{idx + 1}</td>
                          <td className="p-3 font-semibold text-white">{member.display_name}</td>
                          <td className="p-3 font-bold text-primary">Lvl {member.level}</td>
                          <td className="p-3 text-right font-mono font-bold text-reward">{member.xp} XP</td>
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
