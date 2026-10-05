import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  cleanUsername,
  verifyPassword,
  burnTime,
  createSession,
  rateLimit,
  clearRateLimit,
  clientIp,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }
  const username = cleanUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password || password.length > 128) return fail("Enter your username and password.");

  const key = `login:${await clientIp()}:${username}`;
  if (!(await rateLimit(key, 8, 15 * 60 * 1000))) {
    return fail("Too many attempts. Please wait 15 minutes and try again.", 429);
  }

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];
  const ok = user ? await verifyPassword(password, user.passwordHash) : await burnTime(password);
  if (!user || !ok) return fail("Wrong username or password.", 401);

  await clearRateLimit(key);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
