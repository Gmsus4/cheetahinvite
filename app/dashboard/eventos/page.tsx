import { redirect } from "next/navigation";

// Keep existing bookmarks working with a single invitation dashboard.
export default function DashboardEventsPage() {
  redirect("/dashboard");
}
