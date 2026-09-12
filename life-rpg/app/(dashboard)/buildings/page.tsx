import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import type { Building, Profile } from "@/types/database.types";
import { BuildingsClient } from "@/components/buildings/BuildingsClient";

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;
type QueryListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

export default async function BuildingsPage() {
  const auth = await requireUser();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }
  const { user, supabase } = auth;

  // 1. Fetch user's buildings
  const { data: buildingsData } = await (supabase
    .from("buildings")
    .select("*")
    .eq("user_id", user.id) as unknown as QueryListResult<Building>);

  let buildings = buildingsData ?? [];

  if (buildings.length === 0) {
    const defaultTypes = [
      { type: "gym", linked: "fitness" },
      { type: "library", linked: "study" },
      { type: "office", linked: "work" },
      { type: "studio", linked: "personal" },
    ];

    const rows = defaultTypes.map((b) => ({
      user_id: user.id,
      type: b.type,
      linked_category: b.linked,
      level: 1,
      current_xp: 0,
      xp_required_next: 100,
      status: "idle",
      streak_bonus_active: false,
    }));

    const { data: inserted } = await (supabase
      .from("buildings")
      // @ts-ignore
      .insert(rows)
      .select() as unknown as QueryListResult<Building>);
    if (inserted) buildings = inserted;
  }

  // 2. Fetch profile coins
  const { data: profData } = await (supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);
  const profile = profData;

  return <BuildingsClient initialBuildings={buildings} initialProfile={profile} />;
}
