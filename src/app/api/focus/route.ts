import { NextResponse } from "next/server";
import { db } from "@/db";
import { focusSessions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { minutes, date } = (await req.json()) as { minutes: number; date: string };
  if (!minutes || minutes < 1 || minutes > 600 || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await db.insert(focusSessions).values({ userId: user.id, minutes: Math.round(minutes), date });
  return NextResponse.json({ ok: true });
}
