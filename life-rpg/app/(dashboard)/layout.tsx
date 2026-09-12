import { logout } from "@/app/actions/auth";

const navItems = [
  { href: "/tasks",     icon: "📋", label: "Tasks" },
  { href: "/character", icon: "🧙", label: "Character" },
  { href: "/buildings", icon: "🏰", label: "Buildings" },
  { href: "/quests",    icon: "🗺️",  label: "Daily Quests" },
  { href: "/guild",     icon: "⚜️",  label: "Guild" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/10 flex flex-col p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">⚔️ Life RPG</h1>
          <p className="text-xs text-purple-400 mt-1">Your quest awaits</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, icon, label }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </a>
          ))}
        </nav>

        {/* Sign-out — uses a form to invoke the logout Server Action */}
        <div className="border-t border-white/10 pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-sm text-white/40 hover:text-white/70 transition-colors text-left px-4 py-2"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
