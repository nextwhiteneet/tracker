import { NextResponse } from "next/server";
import { regeneratePlan } from "@/lib/data";

export async function POST() {
  const result = await regeneratePlan();
  return NextResponse.json({ ok: true, ...result });
}
