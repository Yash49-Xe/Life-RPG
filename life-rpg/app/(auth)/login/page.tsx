import { login } from "@/app/actions/auth";

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 space-y-6 border-2 border-primary/40 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="brand-gem mx-auto">
            <span>✨</span>
          </div>
          <h1 className="panel-title text-3xl text-white">LIFE RPG</h1>
          <p className="game-label text-primary">Sign in to resume your adventure</p>
        </div>

        {error && (
          <div className="block-inset bg-destructive/20 border-2 border-destructive p-3 text-xs font-bold text-rose-300">
            {error}
          </div>
        )}
        {message && (
          <div className="block-inset bg-success/20 border-2 border-success p-3 text-xs font-bold text-emerald-300">
            {message}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label className="game-label block mb-1">Adventurer Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="hero@realm.com"
              required
              autoComplete="email"
              className="w-full bg-input border-2 border-border p-3 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none"
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
              autoComplete="current-password"
              className="w-full bg-input border-2 border-border p-3 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-none bg-primary hover:bg-primary/90 py-3 text-sm font-extrabold text-primary-foreground transition-all cursor-pointer shadow-glow"
          >
            Enter the Realm ⚔️
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          New adventurer?{" "}
          <a href="/register" className="text-primary font-bold hover:underline">
            Register your hero
          </a>
        </p>
      </div>
    </main>
  );
}
