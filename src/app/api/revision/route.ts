import { NextResponse } from "next/server";
import { db } from "@/db";
import { revisions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { todayStr } from "@/lib/utils";

export async function POST(req: Request) {
  const { chapterId, action, value } = (await req.json()) as {
    chapterId: number;
    action: "round" | "confidence";
    value?: number;
  };
  if (typeof chapterId !== "number") return NextResponse.json({ ok: false }, { status: 400 });

  await db.insert(revisions).values({ chapterId }).onConflictDoNothing();

  if (action === "round") {
    await db
      .update(revisions)
      .set({ rounds: sql`${revisions.rounds} + 1`, lastRevisedOn: todayStr(), updatedAt: new Date() })
      .where(eq(revisions.chapterId, chapterId));
  } else if (action === "confidence") {
    await db
      .update(revisions)
      .set({ confidence: Math.max(0, Math.min(5, value ?? 0)), updatedAt: new Date() })
      .where(eq(revisions.chapterId, chapterId));
  }

  const row = await db.select().from(revisions).where(eq(revisions.chapterId, chapterId)).limit(1);
  return NextResponse.json({ ok: true, revision: row[0] });
}
