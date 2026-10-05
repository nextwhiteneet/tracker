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

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const uid = user.id;
  const [p, s, t, c, r, pi, rv, fs, dn] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, uid)),
    db.select().from(subjects).where(eq(subjects.userId, uid)),
    db.select().from(teachers).where(eq(teachers.userId, uid)),
    db.select().from(chapters).where(eq(chapters.userId, uid)),
    db.select().from(routine).where(eq(routine.userId, uid)),
    db.select().from(planItems).where(eq(planItems.userId, uid)),
    db.select().from(revisions).where(eq(revisions.userId, uid)),
    db.select().from(focusSessions).where(eq(focusSessions.userId, uid)),
    db.select().from(dayNotes).where(eq(dayNotes.userId, uid)),
  ]);
  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    username: user.username,
    profiles: p,
    subjects: s,
    teachers: t,
    chapters: c,
    routine: r,
    planItems: pi,
    revisions: rv,
    focusSessions: fs,
    dayNotes: dn,
  });
}
