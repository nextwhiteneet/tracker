import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  profiles,
  subjects,
  teachers,
  chapters,
  routine,
  planItems,
  revisions,
  focusSessions,
  dayNotes,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

/** Wipes the signed-in user's study data only (the account itself stays). */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const uid = user.id;
  await db.delete(dayNotes).where(eq(dayNotes.userId, uid));
  await db.delete(focusSessions).where(eq(focusSessions.userId, uid));
  await db.delete(revisions).where(eq(revisions.userId, uid));
  await db.delete(planItems).where(eq(planItems.userId, uid));
  await db.delete(routine).where(eq(routine.userId, uid));
  await db.delete(teachers).where(eq(teachers.userId, uid));
  await db.delete(chapters).where(eq(chapters.userId, uid));
  await db.delete(subjects).where(eq(subjects.userId, uid));
  await db.delete(profiles).where(eq(profiles.userId, uid));
  return NextResponse.json({ ok: true });
}
