import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Task } from "@/types/database.types";

interface Params {
  params: Promise<{ id: string }>;
}

type QueryResult<T> = Promise<{ data: T | null; error: Error | null }>;

// ── GET /api/tasks/[id] ────────────────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { data, error } = await (supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single() as unknown as QueryResult<Task>);

  if (error || !data) return err("Task not found", 404);
  return ok(data);
}

// ── PATCH /api/tasks/[id] ──────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  let body: { title?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const updates: { title?: string; category?: string } = {};
  if (body.title?.trim())    updates.title    = body.title.trim();
  if (body.category?.trim()) updates.category = body.category.trim();

  if (Object.keys(updates).length === 0) {
    return err("No valid fields to update", 400);
  }

  const { data, error } = await (supabase
    .from("tasks")
    // @ts-ignore — Supabase Update type infers 'never' with strict generics
    .update(updates)
    .eq("id", id)
    .select()
    .single() as unknown as QueryResult<Task>);

  if (error || !data) return err("Task not found or update failed", 404);
  return ok(data);
}

// ── DELETE /api/tasks/[id] ─────────────────────────────────────────────────────
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const { error, count } = await supabase
    .from("tasks")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) return err(error.message, 500);
  if (!count || count === 0) return err("Task not found", 404);
  return ok({ deleted: true });
}
