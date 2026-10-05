import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { users, sessions, authAttempts } from "@/db/schema";

const COOKIE = "nw_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30; // 30 days

/* ------------------------------ passwords ------------------------------ */

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, keylen, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Used so that "unknown username" takes as long as "wrong password". */
let dummyHash: Promise<string> | null = null;
export function burnTime(password: string): Promise<boolean> {
  dummyHash ??= hashPassword("not-a-real-password");
  return dummyHash.then((h) => verifyPassword(password, h));
}

/* ----------------------------- validation ------------------------------ */

export function cleanUsername(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function validateUsername(u: string): string | null {
  if (u.length < 3 || u.length > 24) return "Username must be 3 to 24 characters.";
  if (!/^[a-z0-9_.]+$/.test(u)) return "Use only letters, numbers, dot and underscore.";
  return null;
}

export function validatePassword(p: unknown): string | null {
  if (typeof p !== "string" || p.length < 8) return "Password must be at least 8 characters.";
  if (p.length > 128) return "Password is too long (max 128 characters).";
  return null;
}

/* ------------------------------ rate limit ----------------------------- */

/** Returns true if the action is allowed. */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const rows = await db.select().from(authAttempts).where(eq(authAttempts.key, key)).limit(1);
  const row = rows[0];
  if (!row || now.getTime() - row.windowStart.getTime() > windowMs) {
    await db
      .insert(authAttempts)
      .values({ key, count: 1, windowStart: now })
      .onConflictDoUpdate({ target: authAttempts.key, set: { count: 1, windowStart: now } });
    return true;
  }
  if (row.count >= max) return false;
  await db
    .update(authAttempts)
    .set({ count: row.count + 1 })
    .where(eq(authAttempts.key, key));
  return true;
}

export async function clearRateLimit(key: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

/* ------------------------------- sessions ------------------------------ */

function sha(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    id: sha(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000),
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  // housekeeping: drop expired sessions
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha(token)));
  jar.delete(COOKIE);
}

export interface SessionUser {
  id: number;
  username: string;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ id: users.id, username: users.username })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
});

/** For pages / layouts: redirects to /login when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
