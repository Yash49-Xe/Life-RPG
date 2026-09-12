import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth-guard";
import { ok, err } from "@/lib/api-response";
import type { Task } from "@/types/database.types";

// ── GET /api/tasks ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get("status");
  const category = searchParams.get("category");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status)   query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data, error } = await query as { data: Task[] | null; error: Error | null };

  if (error) return err((error as Error).message, 500);
  return ok(data ?? []);
}

// ── POST /api/tasks ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  let body: { category?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body", 400);
  }

  const { category, title } = body;
  if (!category?.trim()) return err("category is required", 400);
  if (!title?.trim())    return err("title is required", 400);

  const payload = { user_id: user.id, category: category.trim(), title: title.trim(), status: "pending" as const };
  const { data, error } = await (supabase
    .from("tasks")
    // @ts-ignore — Supabase Insert type infers 'never' with strict generics
    .insert(payload)
    .select()
    .single() as unknown as Promise<{ data: Task | null; error: Error | null }>);

  if (error) return err((error as Error).message, 500);
  return ok(data, 201);
}
