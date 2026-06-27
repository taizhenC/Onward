"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

// Makes every Framer Motion animation respect the OS "reduce motion" setting:
// transform/layout motion is dropped, opacity is kept. CSS animations are
// handled separately by the prefers-reduced-motion block in globals.css.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
