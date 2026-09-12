export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-10 backdrop-blur-md border border-white/10 shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-1 text-center">⚔️ Life RPG</h1>
        <p className="text-purple-300 mb-8 text-center text-sm">Create your account and begin</p>
        <div className="space-y-4">
          <input type="email" placeholder="Email"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <input type="password" placeholder="Password"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <button type="button"
            className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-3 text-white font-semibold transition-colors">
            Create Account
          </button>
          <p className="text-sm text-white/50 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-purple-400 hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </main>
  );
}
