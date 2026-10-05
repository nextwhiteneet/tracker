"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import Lenis from "lenis";

function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const lenis = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
    });
    return () => lenis.destroy();
  }, []);
  return null;
}

export function ThemeProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <SmoothScroll />
      {children}
    </ThemeProvider>
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={`tick !w-9 !h-9 ${className}`}
      style={{ borderWidth: 1 }}
    >
      {mounted ? (
        resolvedTheme === "dark" ? (
          <Sun size={15} className="text-accent" />
        ) : (
          <Moon size={15} className="text-ink-2" />
        )
      ) : (
        <span className="w-4 h-4" />
      )}
    </button>
  );
}
