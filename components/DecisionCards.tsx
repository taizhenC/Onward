"use client";

import { useState } from "react";
import { motion } from "motion/react";

type Props = {
  options: { label: string }[];
  onPick: (label: string) => Promise<void>;
};

export function DecisionCards({ options, onPick }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePick(label: string) {
    if (picked || submitting) return;
    setPicked(label);
    setSubmitting(true);
    try {
      await onPick(label);
    } catch {
      setPicked(null);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {options.map((option) => {
        const isPicked = picked === option.label;
        const isFaded = picked !== null && !isPicked;
        return (
          <motion.button
            key={option.label}
            type="button"
            onClick={() => handlePick(option.label)}
            disabled={picked !== null || submitting}
            initial={{ opacity: 1 }}
            animate={{ opacity: isFaded ? 0.2 : 1 }}
            transition={{ duration: 0.5 }}
            className="block w-full text-left px-6 py-5 border border-[var(--color-ink-soft)] hover:border-[var(--color-ink)] disabled:cursor-default transition-colors"
          >
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
}
