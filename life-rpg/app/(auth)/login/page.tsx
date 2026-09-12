import { login } from "@/app/actions/auth";

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-10 backdrop-blur-md border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-1 text-center">⚔️ Life RPG</h1>
        <p className="text-purple-300 mb-8 text-center text-sm">Sign in to continue your quest</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg bg-green-500/20 border border-green-500/40 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        <form action={login} className="space-y-4">
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-3 text-white font-semibold transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-sm text-white/50 text-center">
          No account?{" "}
          <a href="/register" className="text-purple-400 hover:underline">
            Register
          </a>
        </p>
      </div>
    </main>
  );
}
