import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import type { Task, DailyQuest } from "@/types/database.types";
import { TasksClient } from "@/components/tasks/TasksClient";

type QueryListResult<T> = Promise<{ data: T[] | null; error: Error | null }>;

export default async function TasksPage() {
  const auth = await requireUser();
  if (auth.error || !auth.user || !auth.supabase) {
    redirect("/login");
  }
  const { user, supabase } = auth;

  // 1. Fetch user's tasks
  const { data: tasksData } = await (supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as unknown as QueryListResult<Task>);
  const tasks = tasksData ?? [];

  // 2. Fetch or auto-assign daily quests
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: existingQuests } = await (supabase
    .from("quests")
    .select("*")
    .eq("user_id", user.id)
    .eq("assigned_date", todayStr) as unknown as QueryListResult<DailyQuest>);

  let quests = existingQuests ?? [];

  // If no quests for today, auto-assign 3 daily quests from templates pool
  if (quests.length === 0) {
    const templates = [
      "Complete 1 Study focus session",
      "Upload 1 workout photo",
      "Check in at Gym location",
    ];

    const newQuestRows = templates.map((template) => ({
      user_id: user.id,
      task_template: template,
      assigned_date: todayStr,
      status: "pending",
      bonus_xp: 30,
    }));

    const { data: insertedQuests } = await (supabase
      .from("quests")
      // @ts-ignore
      .insert(newQuestRows)
      .select() as unknown as QueryListResult<DailyQuest>);
    if (insertedQuests) {
      quests = insertedQuests;
    }
  }

  return <TasksClient initialTasks={tasks} initialQuests={quests} />;
}
