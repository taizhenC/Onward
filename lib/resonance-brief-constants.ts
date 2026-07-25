// Provider-neutral recipe identity. Kept separate from the server-only HMAC
// implementation so deployment startup checks can run in Next's instrumentation
// runtimes without pulling Node crypto into the edge bundle.
export const RESONANCE_BRIEF_VERSION = "resonance-brief-v1-2026-07";
export const RESONANCE_BRIEF_SENSITIVITY = "sensitive-derived-ephemeral";
