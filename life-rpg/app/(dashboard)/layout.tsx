import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth-guard";
import type { Character, Profile } from "@/types/database.types";

const navItems = [
  { href: "/",           icon: "🏠", label: "Dashboard" },
  { href: "/tasks",     icon: "📋", label: "Tasks & Quests" },
  { href: "/buildings", icon: "🏰", label: "Village" },
  { href: "/character", icon: "🧙", label: "Character" },
  { href: "/guild",     icon: "⚜️",  label: "Guild & Rank" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireUser();
  const user = auth.user;
  const supabase = auth.supabase;

  let character: Character | null = null;
  let profile: Profile | null = null;

  if (user && supabase) {
    const { data: charData } = await supabase
      .from("character")
      .select("*")
      .eq("user_id", user.id)
      .single();
    character = charData as Character | null;

    const { data: profData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = profData as Profile | null;
  }

  const level = character?.level ?? 1;
  const xp = character?.xp ?? 0;
  const coins = profile?.coins ?? 0;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* ARIA Live Region for accessibility announcements (XP gained, level ups) */}
      <div id="game-announcer" aria-live="polite" className="sr-only" />

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 sticky top-0 h-screen z-30 hidden md:flex">
        <div className="mb-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              ⚔️
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide">LIFE RPG</h1>
              <p className="text-xs text-indigo-400 font-medium">Gamified Task Tracker</p>
            </div>
          </Link>
        </div>

        {/* User Mini Stat Card */}
        <div className="mb-6 rounded-xl bg-slate-800/60 p-3 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">LVL {level}</span>
            </span>
            <span className="text-yellow-400 font-bold">🪙 {coins} Coins</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${Math.min(100, (xp % 100))}%` }}
            />
          </div>
          <div className="text-[10px] text-right text-slate-400">{xp} total XP</div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="flex-1 space-y-1.5">
          {navItems.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium focus:ring-2 focus:ring-indigo-400"
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Sign-out button */}
        <div className="border-t border-white/10 pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors text-left px-4 py-2 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              🚪 Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content & Mobile Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between bg-slate-900 p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <span>⚔️</span> LIFE RPG
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-amber-400 font-bold">Lvl {level}</span>
            <span className="text-yellow-400 font-bold">🪙 {coins}</span>
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <nav className="md:hidden flex items-center justify-around bg-slate-900/95 border-b border-white/10 p-2 text-xs">
          {navItems.map(({ href, icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center p-1 text-slate-300">
              <span className="text-base">{icon}</span>
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
