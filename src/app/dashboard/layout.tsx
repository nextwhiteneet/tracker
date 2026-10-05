import { redirect } from "next/navigation";
import { getProfile, getStats } from "@/lib/data";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile.setupCompleted) redirect("/setup");
  const stats = await getStats();
  return (
    <Shell name={profile.name} streak={stats.streak} examDaysLeft={stats.examDaysLeft}>
      {children}
    </Shell>
  );
}
