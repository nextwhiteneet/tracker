import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { todayStr, addDays } from "@/lib/utils";
import { SectionHead } from "@/components/ui";
import { FocusClient } from "@/components/focus-client";
import { and, eq, gte } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const user = await requireUser();
  const today = todayStr();
  const weekAgo = addDays(today, -6);
  const sessions = await db.select().from(focusSessions).where(and(eq(focusSessions.userId, user.id), gte(focusSessions.date, weekAgo)));
  const todayMin = sessions.filter((s) => s.date === today).reduce((a, s) => a + s.minutes, 0);
  const weekMin = sessions.reduce((a, s) => a + s.minutes, 0);

  return (
    <div className="page-enter space-y-7">
      <SectionHead
        eyebrow="Deep focus"
        title="One timer. No phone. Full presence."
        sub="Completed sessions feed your streak, heatmap and study-hours analytics."
      />
      <FocusClient today={today} initialTodayMin={todayMin} weekMin={weekMin} initialSessions={sessions.length} />
    </div>
  );
}
