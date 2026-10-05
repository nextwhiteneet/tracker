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

export async function POST() {
  await db.delete(dayNotes);
  await db.delete(focusSessions);
  await db.delete(revisions);
  await db.delete(planItems);
  await db.delete(routine);
  await db.delete(teachers);
  await db.delete(chapters);
  await db.delete(subjects);
  await db.delete(profiles);
  return NextResponse.json({ ok: true });
}
