import { NextResponse } from "next/server";
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

export const dynamic = "force-dynamic";

export async function GET() {
  const [p, s, t, c, r, pi, rv, fs, dn] = await Promise.all([
    db.select().from(profiles),
    db.select().from(subjects),
    db.select().from(teachers),
    db.select().from(chapters),
    db.select().from(routine),
    db.select().from(planItems),
    db.select().from(revisions),
    db.select().from(focusSessions),
    db.select().from(dayNotes),
  ]);
  return NextResponse.json({
    exportedAt: new Date().toISOString(),
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
