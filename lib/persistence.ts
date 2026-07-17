export type PersistenceMode = "memory" | "supabase";

// One fail-closed parser for every auth/data boundary. Local development keeps
// the zero-config memory default; a production process must name Supabase unless
// an explicit build-only override is present. The npm lifecycle check makes a
// copied override inert in `next start` and other served runtimes.
export function persistenceMode(): PersistenceMode {
  const raw = process.env.PERSISTENCE?.trim().toLowerCase();
  const mode = raw === undefined || raw === "" ? "memory" : raw;
  if (mode !== "memory" && mode !== "supabase") {
    throw new Error("PERSISTENCE must be either memory or supabase");
  }
  if (
    process.env.NODE_ENV === "production" &&
    mode !== "supabase" &&
    !isBuildOnlyMemoryOverride()
  ) {
    throw new Error(
      "PERSISTENCE=supabase is required in production; memory mode is not owner-safe across public instances",
    );
  }
  return mode;
}

function isBuildOnlyMemoryOverride(): boolean {
  return (
    process.env.ONWARD_ALLOW_MEMORY_IN_PRODUCTION === "true" &&
    process.env.npm_lifecycle_event === "build"
  );
}
