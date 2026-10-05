import { redirect } from "next/navigation";
import { getProfile, getStats } from "@/lib/data";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile.setupCompleted) redirect("/setup");
  const stats = await getStats(user.id);
  return (
    <Shell username={user.username} name={profile.name} streak={stats.streak} examDaysLeft={stats.examDaysLeft}>
      {children}
    </Shell>
  );
}
