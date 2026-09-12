import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Task, VerificationType } from "@/types/database.types";

interface Params { params: Promise<{ id: string }> }
type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

/**
 * POST /api/tasks/[id]/start
 * 
 * Starts the task session / timer server-side:
 *  - Records `started_at` timestamp.
 *  - Automatically maps category to `verification_type`:
 *    - Study / Focus -> 'timer'
 *    - Exercise -> 'photo'
 *    - Gym -> 'gps'
 *    - Other -> 'none'
 */
export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;

  // Optional body: { minDurationSeconds?: number }
  let minDurationSeconds = 60;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.minDurationSeconds === "number" && body.minDurationSeconds > 0) {
      minDurationSeconds = body.minDurationSeconds;
    }
  } catch {
    // default minDurationSeconds = 60
  }

  // Fetch task (RLS enforces ownership)
  const { data: task } = await (supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single() as unknown as QueryResult<Task>);

  if (!task) return err("Task not found", 404);

  if (task.status !== "pending") {
    return err(`Task is already '${task.status}' and cannot be started`, 409);
  }

  // Determine verification type based on category if not explicitly set
  let vType: VerificationType = task.verification_type || "none";
  if (vType === "none" || !vType) {
    const cat = task.category.toLowerCase();
    if (cat === "study" || cat === "focus") {
      vType = "timer";
    } else if (cat === "exercise" || cat === "workout") {
      vType = "photo";
    } else if (cat === "gym" || cat === "fitness") {
      vType = "gps";
    }
  }

  const startedAt = new Date().toISOString();

  const { data: updatedTask, error: updateError } = await (supabase
    .from("tasks")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update({
      started_at: startedAt,
      min_duration_seconds: minDurationSeconds,
      verification_type: vType,
      verification_status: vType !== "none" ? "pending" : "unverified",
    })
    .eq("id", id)
    .select()
    .single() as unknown as QueryResult<Task>);

  if (updateError || !updatedTask) {
    return err("Failed to start task timer session", 500);
  }

  return ok({
    task: updatedTask,
    message: `Started timer session for task '${task.title}'. Verification type: ${vType}`,
  });
}
