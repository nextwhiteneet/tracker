import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { chapters, chapterChecks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const FIELDS = ["dpp", "notes", "ncert", "pyq"] as const;
type Field = (typeof FIELDS)[number];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { chapterId, field, value } = (await req.json()) as { chapterId: number; field: Field; value: boolean };
  if (typeof chapterId !== "number" || !FIELDS.includes(field) || typeof value !== "boolean") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const own = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.userId, user.id)))
    .limit(1);
  if (!own.length) return NextResponse.json({ ok: false }, { status: 404 });

  const patch: Partial<Record<Field, boolean>> = {};
  patch[field] = value;
  await db
    .insert(chapterChecks)
    .values({ userId: user.id, chapterId, ...patch })
    .onConflictDoUpdate({ target: chapterChecks.chapterId, set: { ...patch, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
