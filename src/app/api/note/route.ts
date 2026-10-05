import { NextResponse } from "next/server";
import { db } from "@/db";
import { dayNotes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { date, text } = (await req.json()) as { date: string; text: string };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return NextResponse.json({ ok: false }, { status: 400 });
  const clean = String(text ?? "").slice(0, 5000);
  await db
    .insert(dayNotes)
    .values({ userId: user.id, date, text: clean })
    .onConflictDoUpdate({ target: [dayNotes.userId, dayNotes.date], set: { text: clean } });
  return NextResponse.json({ ok: true });
}
