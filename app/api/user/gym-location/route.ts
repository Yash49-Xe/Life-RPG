import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Profile } from "@/types/database.types";

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * GET /api/user/gym-location
 * Returns the user's saved Gym location details from profile.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { data: profile, error } = await (supabase
    .from("profiles")
    .select("id, email, coins, created_at, gym_latitude, gym_longitude, gym_name")
    .eq("id", user.id)
    .single() as unknown as QueryResult<Profile>);

  if (error || !profile) return err("Failed to fetch profile", 500);

  return ok({
    id: profile.id,
    email: profile.email,
    coins: profile.coins ?? 0,
    created_at: profile.created_at,
    gym_latitude: profile.gym_latitude ?? null,
    gym_longitude: profile.gym_longitude ?? null,
    gym_name: profile.gym_name ?? "My Gym",
  });
}

/**
 * POST /api/user/gym-location
 * Updates and saves the user's default Gym location to DB.
 * Body: { latitude: number, longitude: number, name?: string }
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  let latitude: number;
  let longitude: number;
  let name: string = "My Gym";

  try {
    const body = await request.json();
    latitude = Number(body.latitude);
    longitude = Number(body.longitude);
    if (body.name && typeof body.name === "string" && body.name.trim()) {
      name = body.name.trim();
    }
  } catch {
    return err("Invalid request body. Latitude and longitude are required.", 400);
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    return err("Valid numeric latitude and longitude required.", 400);
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return err("Coordinates out of physical range (lat [-90,90], lng [-180,180]).", 400);
  }

  const { data: updatedProfile, error: updateError } = await (supabase
    .from("profiles")
    // @ts-ignore
    .update({
      gym_latitude: latitude,
      gym_longitude: longitude,
      gym_name: name,
    })
    .eq("id", user.id)
    .select("id, email, coins, gym_latitude, gym_longitude, gym_name")
    .single() as unknown as QueryResult<Profile>);

  if (updateError || !updatedProfile) {
    return err("Failed to update gym location in database.", 500);
  }

  return ok({
    profile: updatedProfile,
    message: `Default Gym location updated to '${name}' (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}).`,
  });
}
