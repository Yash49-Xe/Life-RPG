import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   Date;
}

/**
 * DB-backed rate limiter using the rate_limits table (written via admin client).
 *
 * @param userId        The authenticated user's UUID
 * @param action        Rate limit bucket key (e.g. 'task_complete')
 * @param limit         Max allowed calls in the window
 * @param windowSeconds Duration of the window in seconds (default 3600 = 1 hr)
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowSeconds = 3600
): Promise<RateLimitResult> {
  const admin = createAdminClient();
  const now = new Date();
  const windowMs = windowSeconds * 1000;

  // Fetch existing record
  const { data: existing } = await admin
    .from("rate_limits")
    .select("user_id, action, window_start, count")
    .eq("user_id", userId)
    .eq("action", action)
    .returns<{ user_id: string; action: string; window_start: string; count: number }[]>()
    .maybeSingle();

  // Window expired or no record — reset
  if (
    !existing ||
    now.getTime() - new Date(existing.window_start).getTime() >= windowMs
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from("rate_limits").upsert(
      {
        user_id:      userId,
        action,
        window_start: now.toISOString(),
        count:        1,
      } as any,
      { onConflict: "user_id,action" }
    );

    return {
      allowed:   true,
      remaining: limit - 1,
      resetAt:   new Date(now.getTime() + windowMs),
    };
  }

  const resetAt = new Date(
    new Date(existing.window_start).getTime() + windowMs
  );

  // Window still active and limit reached
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newCount = existing.count + 1;
  // @ts-ignore — Supabase Update type infers 'never' with strict generics
  await admin.from("rate_limits").update({ count: newCount }).eq("user_id", userId).eq("action", action);

  return {
    allowed:   true,
    remaining: limit - existing.count - 1,
    resetAt,
  };
}
