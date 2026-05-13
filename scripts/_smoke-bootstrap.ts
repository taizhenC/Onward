import { createRequire } from "node:module";

// The "server-only" npm package throws on import by default. Next's bundler
// aliases it to an empty module on the server build; outside the bundler
// (this tsx-run script) we have to do the same shim by hand. Pre-cache the
// resolved path with an empty module so any subsequent `import "server-only"`
// from lib/* resolves to {} instead of executing the package's throw.
//
// Phase 1 replaces scripts/smoke.ts with a real test runner (Vitest), which
// has a built-in resolve.alias config for exactly this case.
const requireFn = createRequire(import.meta.url);
const serverOnlyPath = requireFn.resolve("server-only");

requireFn.cache[serverOnlyPath] = {
  id: serverOnlyPath,
  filename: serverOnlyPath,
  loaded: true,
  children: [],
  paths: [],
  exports: {},
} as unknown as NodeJS.Module;
