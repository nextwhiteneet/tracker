import { NextResponse } from "next/server";
import { getConfig, saveConfig, type SaveConfigInput } from "@/lib/data";
import { DEFAULT_SYLLABUS } from "@/lib/syllabus";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getConfig();
  return NextResponse.json({ config, defaults: DEFAULT_SYLLABUS });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveConfigInput;
    await saveConfig(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Failed to save configuration" }, { status: 500 });
  }
}
