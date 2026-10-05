import { NextResponse } from "next/server";
import { regeneratePlan } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const result = await regeneratePlan(user.id);
  return NextResponse.json({ ok: true, ...result });
}
