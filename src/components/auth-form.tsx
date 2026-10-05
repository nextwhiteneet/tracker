"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthForm({ requireInvite }: { requireInvite: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function submit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, invite }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network problem. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span
            className="grid place-items-center rounded-xl bg-ink dark:bg-accent leading-none"
            style={{ width: 34, height: 34, fontSize: 21 }}
            aria-hidden="true"
          >
            🥼
          </span>
          <span className="font-display text-xl tracking-tight">NEXT WHITE</span>
        </Link>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <h1 className="font-display text-2xl leading-tight">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-[13px] text-ink-2 mt-1">
              {isSignup
                ? "Your plan and progress stay private to your account."
                : "Sign in to continue your preparation."}
            </p>
          </div>

          <label className="block">
            <span className="text-[12px] font-medium text-ink-2">Username</span>
            <input
              className="input mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="e.g. aarav_2028"
              maxLength={24}
              required
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-ink-2">Password</span>
            <input
              className="input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              maxLength={128}
              required
            />
          </label>

          {isSignup && requireInvite && (
            <label className="block">
              <span className="text-[12px] font-medium text-ink-2">Invite code</span>
              <input
                className="input mt-1"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                autoComplete="off"
                placeholder="Ask the person who shared this app"
                required
              />
            </label>
          )}

          {error && (
            <p role="alert" className="text-[13px] text-bad">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>

          <p className="text-[13px] text-ink-2 text-center">
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              className="font-medium text-ink underline underline-offset-4"
              onClick={() => {
                setMode(isSignup ? "login" : "signup");
                setError("");
              }}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </button>
          </p>
        </form>

        <p className="text-[11.5px] text-ink-3 text-center mt-5">
          Passwords are stored hashed — nobody, including the site owner, can read them.
        </p>
      </div>
    </main>
  );
}
