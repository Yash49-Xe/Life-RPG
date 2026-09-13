import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { GameShell } from "@/components/game-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireUser();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }

  return <GameShell>{children}</GameShell>;
}
