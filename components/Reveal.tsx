"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

// Scroll-entrance wrapper for the landing page: fades a block up once when it
// enters the viewport. Reduced motion is handled by the app-wide
// <MotionConfig reducedMotion="user"> (MotionProvider) — the y-rise is dropped
// there and the opacity fade kept, same as every other motion component.

type RevealProps = {
  children: ReactNode;
  /** Seconds to wait after entering the viewport (for sibling staggers). */
  delay?: number;
  /** Portion of the element that must be visible to trigger. */
  amount?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, amount = 0.25, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
