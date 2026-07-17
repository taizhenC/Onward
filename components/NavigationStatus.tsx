"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function NavigationStatus({
  children,
  kind = "status",
  className,
}: {
  children: ReactNode;
  kind?: "status" | "alert";
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <p
      ref={ref}
      role={kind}
      tabIndex={-1}
      className={`${className ?? ""} outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-4`}
    >
      {children}
    </p>
  );
}
