import { NextResponse } from "next/server";
import { db } from "@/db";
import { planItems, chapters } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const { id, done } = (await req.json()) as { id: number; done: boolean };
  if (typeof id !== "number") return NextResponse.json({ ok: false }, { status: 400 });

  const rows = await db
    .update(planItems)
    .set({ status: done ? "done" : "pending", doneAt: done ? new Date() : null })
    .where(eq(planItems.id, id))
    .returning();

  const item = rows[0];
  let chapterJustCompleted = false;

  if (done && item?.chapterId != null && item.kind === "lecture") {
    const [doneCount] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(planItems)
      .where(and(eq(planItems.chapterId, item.chapterId), eq(planItems.status, "done"), eq(planItems.kind, "lecture")));
    const ch = await db.select().from(chapters).where(eq(chapters.id, item.chapterId)).limit(1);
    if (ch[0] && doneCount.n >= ch[0].totalLectures) chapterJustCompleted = true;
  }

  return NextResponse.json({ ok: true, item, chapterJustCompleted });
}
