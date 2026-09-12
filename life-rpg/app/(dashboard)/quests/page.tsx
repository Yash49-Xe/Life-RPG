import { redirect } from "next/navigation";

export default function QuestsPage() {
  // Redirect /quests to /tasks where daily quests are prominently featured
  redirect("/tasks");
}
