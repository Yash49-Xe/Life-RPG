import { register } from "@/app/actions/auth";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 space-y-6 border-2 border-accent/40 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="brand-gem mx-auto">
            <span>⚔️</span>
          </div>
          <h1 className="panel-title text-3xl text-white">FORGE HERO</h1>
          <p className="game-label text-accent">Create an account to begin your RPG quest</p>
        </div>

        {error && (
          <div className="block-inset bg-destructive/20 border-2 border-destructive p-3 text-xs font-bold text-rose-300">
            {error}
          </div>
        )}

        <form action={register} className="space-y-4">
          <div>
            <label className="game-label block mb-1">Adventurer Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="hero@realm.com"
              required
              autoComplete="email"
              className="w-full bg-input border-2 border-border p-3 text-sm text-white placeholder-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="game-label block mb-1">Secret Key / Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full bg-input border-2 border-border p-3 text-sm text-white placeholder-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 py-3 text-sm font-extrabold text-accent-foreground transition-all cursor-pointer shadow-glow"
          >
            Forge Hero & Begin 🚀
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Already forged?{" "}
          <a href="/login" className="text-accent font-bold hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
