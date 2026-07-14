"use client";

import { motion } from "motion/react";
import type { CrisisResource } from "@/lib/types";

export function CrisisCard({ resources }: { resources: CrisisResource[] }) {
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
        {resources.map((resource) => (
          <li
            key={resource.id}
            className="border-l-2 border-[var(--color-accent)] pl-4"
          >
            <a
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--color-ink-soft)]/40 underline-offset-4"
            >
              <span className="block font-ui text-xs uppercase tracking-wider text-[var(--color-ink-soft)]">
                {resource.region}
              </span>
              <span className="block">{resource.label}</span>
              <span className="block text-[var(--color-ink-soft)]">
                {resource.action}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="font-ui text-xs text-[var(--color-ink-soft)]">
        Onward is not therapy and not an emergency service. If you are in
        immediate danger, call your local emergency number.
      </p>
      <p className="font-ui text-xs text-[var(--color-ink-soft)]">
        Onward did not save what you wrote and will not start a story from this
        message. You can return another time.
      </p>
    </motion.div>
  );
}
