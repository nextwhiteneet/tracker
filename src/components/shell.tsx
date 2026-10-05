"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  Timer,
  Settings,
  Flame,
} from "lucide-react";
import { ThemeToggle } from "./theme";
import { LogoMark } from "@/app/page";

const NAV = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/dashboard/tracker", label: "Tracker", icon: Library },
  { href: "/dashboard/backlogs", label: "Backlogs", icon: AlertTriangle },
  { href: "/dashboard/revision", label: "Revision", icon: RotateCcw },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/focus", label: "Focus", icon: Timer },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Shell({
  children,
  name,
  streak,
  examDaysLeft,
}: {
  children: React.ReactNode;
  name: string;
  streak: number;
  examDaysLeft: number;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex w-60 flex-col border-r border-line bg-surface px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <LogoMark />
          <div>
            <div className="font-display text-[17px] leading-none">Ascent</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-3 mt-1">NEET tracker</div>
          </div>
        </Link>
        <nav className="space-y-1 flex-1">
          {NAV.map((n) => {
            const active = n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-300 ${
                  active
                    ? "bg-ink text-bg dark:bg-accent dark:text-white shadow-sm"
                    : "text-ink-2 hover:text-ink hover:bg-surface-2"
                }`}
              >
                <n.icon size={17} strokeWidth={active ? 2.4 : 2} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-line bg-surface-2 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={15} className="text-accent streak-pulse" />
            <span className="mono font-semibold text-sm">{streak} day streak</span>
          </div>
          <p className="text-[11.5px] text-ink-2 leading-relaxed">
            {examDaysLeft} days to NEET, {name.split(" ")[0] || "doc"}. Stay green.
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-line bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark small />
            <span className="font-display text-base">Ascent</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="chip !py-1">
              <Flame size={12} className="text-accent" />
              <span className="mono">{streak}</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((n) => {
            const active = n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium whitespace-nowrap transition-colors duration-300 ${
                  active ? "bg-ink text-bg dark:bg-accent dark:text-white" : "text-ink-2"
                }`}
              >
                <n.icon size={14} />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 md:px-8 pt-8 pb-24">{children}</div>
      </div>

      {/* desktop theme toggle */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-40">
        <ThemeToggle className="bg-surface shadow-md" />
      </div>
    </div>
  );
}
