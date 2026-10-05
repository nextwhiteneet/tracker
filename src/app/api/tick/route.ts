import { NextResponse } from "next/server";
import { db } from "@/db";
import { planItems, chapters } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { id, done } = (await req.json()) as { id: number; done: boolean };
  if (typeof id !== "number") return NextResponse.json({ ok: false }, { status: 400 });

  const rows = await db
    .update(planItems)
    .set({ status: done ? "done" : "pending", doneAt: done ? new Date() : null })
    .where(and(eq(planItems.id, id), eq(planItems.userId, user.id)))
    .returning();

  const item = rows[0];
  let chapterJustCompleted = false;

  if (done && item?.chapterId != null && item.kind === "lecture") {
    const [doneCount] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(planItems)
      .where(
        and(
          eq(planItems.userId, user.id),
          eq(planItems.chapterId, item.chapterId),
          eq(planItems.status, "done"),
          eq(planItems.kind, "lecture")
        )
      );
    const ch = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.id, item.chapterId), eq(chapters.userId, user.id)))
      .limit(1);
    if (ch[0] && doneCount.n >= ch[0].totalLectures) chapterJustCompleted = true;
  }

  return NextResponse.json({ ok: true, item, chapterJustCompleted });
}
