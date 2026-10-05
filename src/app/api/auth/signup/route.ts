import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  cleanUsername,
  validateUsername,
  validatePassword,
  hashPassword,
  createSession,
  rateLimit,
  clientIp,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown; invite?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }

  const ip = await clientIp();
  if (!(await rateLimit(`signup:${ip}`, 10, 60 * 60 * 1000))) {
    return fail("Too many sign-ups from this network. Try again later.", 429);
  }

  // Optional invite code: set SIGNUP_CODE in Vercel to keep sign-ups friends-only.
  const requiredCode = process.env.SIGNUP_CODE;
  if (requiredCode && String(body.invite ?? "").trim() !== requiredCode) {
    return fail("Wrong invite code.", 403);
  }

  const username = cleanUsername(body.username);
  const uErr = validateUsername(username);
  if (uErr) return fail(uErr);
  const pErr = validatePassword(body.password);
  if (pErr) return fail(pErr);

  try {
    const passwordHash = await hashPassword(body.password as string);
    const [user] = await db.insert(users).values({ username, passwordHash }).returning({ id: users.id });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "23505") return fail("That username is already taken.", 409);
    console.error(e);
    return fail("Could not create the account. Please try again.", 500);
  }
}
