import { NextResponse } from "next/server";
import { getConfig, saveConfig, type SaveConfigInput } from "@/lib/data";
import { DEFAULT_SYLLABUS } from "@/lib/syllabus";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const config = await getConfig(user.id);
  return NextResponse.json({ config, defaults: DEFAULT_SYLLABUS });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  try {
    const body = (await req.json()) as SaveConfigInput;
    await saveConfig(user.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Failed to save configuration" }, { status: 500 });
  }
}
