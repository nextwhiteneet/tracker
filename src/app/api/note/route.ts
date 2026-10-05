import { NextResponse } from "next/server";
import { db } from "@/db";
import { dayNotes } from "@/db/schema";

export async function POST(req: Request) {
  const { date, text } = (await req.json()) as { date: string; text: string };
  if (!date) return NextResponse.json({ ok: false }, { status: 400 });
  await db
    .insert(dayNotes)
    .values({ date, text: text ?? "" })
    .onConflictDoUpdate({ target: dayNotes.date, set: { text: text ?? "" } });
  return NextResponse.json({ ok: true });
}
