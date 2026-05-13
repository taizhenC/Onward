"use client";

import { motion } from "motion/react";

export function CrisisCard({ resources }: { resources: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <h2 className="text-2xl">If you might be in danger, please reach out.</h2>
      <p className="text-[var(--color-ink-soft)]">
        These lines are staffed by people trained for exactly this. They will
        not judge you.
      </p>
      <ul className="space-y-3">
        {resources.map((line) => (
          <li
            key={line}
            className="border-l-2 border-[var(--color-accent)] pl-4"
          >
            {line}
          </li>
        ))}
      </ul>
      <p className="font-ui text-xs text-[var(--color-ink-soft)]">
        Onward is not therapy and not an emergency service. If you are in
        immediate danger, call your local emergency number.
      </p>
    </motion.div>
  );
}
