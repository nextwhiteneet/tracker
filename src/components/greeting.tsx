"use client";

import { useEffect, useState } from "react";
import { greeting } from "@/lib/utils";

/** Greeting that follows the viewer's own clock (the server runs in UTC, so it can't know). */
export function Greeting() {
  const [text, setText] = useState("Hello");
  useEffect(() => {
    const tick = () => setText(greeting(new Date().getHours()));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return <span suppressHydrationWarning>{text}</span>;
}
