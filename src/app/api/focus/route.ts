import { NextResponse } from "next/server";
import { db } from "@/db";
import { focusSessions } from "@/db/schema";

export async function POST(req: Request) {
  const { minutes, date } = (await req.json()) as { minutes: number; date: string };
  if (!minutes || minutes < 1 || minutes > 600) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await db.insert(focusSessions).values({ minutes: Math.round(minutes), date });
  return NextResponse.json({ ok: true });
}
