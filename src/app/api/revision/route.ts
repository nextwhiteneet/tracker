import { NextResponse } from "next/server";
import { db } from "@/db";
import { chapters, revisions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { todayStr } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { chapterId, action, value } = (await req.json()) as {
    chapterId: number;
    action: "round" | "confidence";
    value?: number;
  };
  if (typeof chapterId !== "number") return NextResponse.json({ ok: false }, { status: 400 });

  // The chapter must belong to the signed-in user
  const own = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.userId, user.id)))
    .limit(1);
  if (!own.length) return NextResponse.json({ ok: false }, { status: 404 });

  await db.insert(revisions).values({ userId: user.id, chapterId }).onConflictDoNothing();

  if (action === "round") {
    await db
      .update(revisions)
      .set({ rounds: sql`${revisions.rounds} + 1`, lastRevisedOn: todayStr(), updatedAt: new Date() })
      .where(and(eq(revisions.chapterId, chapterId), eq(revisions.userId, user.id)));
  } else if (action === "confidence") {
    await db
      .update(revisions)
      .set({ confidence: Math.max(0, Math.min(5, value ?? 0)), updatedAt: new Date() })
      .where(and(eq(revisions.chapterId, chapterId), eq(revisions.userId, user.id)));
  }

  const row = await db
    .select()
    .from(revisions)
    .where(and(eq(revisions.chapterId, chapterId), eq(revisions.userId, user.id)))
    .limit(1);
  return NextResponse.json({ ok: true, revision: row[0] });
}
