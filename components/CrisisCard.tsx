"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { CrisisResourceOrigin } from "@/lib/intake-request-privacy";
import type { CrisisResource } from "@/lib/types";

const NO_REQUEST_COPY =
  "Onward did not save what you wrote and will not start a story from this message. You can return another time.";

const CRISIS_REQUEST_COPY: Readonly<Record<CrisisResourceOrigin, string>> =
  Object.freeze({
    server_no_write: NO_REQUEST_COPY,
    server_confirmed_no_story: NO_REQUEST_COPY,
    local_no_request: NO_REQUEST_COPY,
    request_may_have_started:
      "You opened these resources after a story request was sent. That request may already have created a story; opening these resources does not cancel it, and the story may still open. You can leave the story at any time.",
  });

export function CrisisCard({
  resources,
  origin,
}: {
  resources: CrisisResource[];
  origin: CrisisResourceOrigin;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      role="alert"
      aria-live="assertive"
      aria-labelledby="crisis-heading"
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 focus:outline-2 focus:outline-offset-4 focus:outline-[var(--color-accent)]"
    >
      <h1 id="crisis-heading" className="text-2xl">
        If you might be in danger, please reach out.
      </h1>
      <p className="text-[var(--color-ink-soft)]">
        These services can connect you with trained crisis support.
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
      <p className="font-ui text-xs leading-relaxed text-[var(--color-ink-soft)]">
        {CRISIS_REQUEST_COPY[origin]}
      </p>
    </motion.div>
  );
}
