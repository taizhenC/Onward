import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env.local loader for tsx-run scripts. `next dev` loads .env.local
// automatically; tsx does NOT, so real-mode scripts (check-provider, eval-match)
// call loadEnvLocal() to pull GROQ_API_KEY (and friends) into process.env.
//
// No dotenv dependency — the format we need is trivial. Deliberately conservative:
//   - shell / CI env always wins (never overrides an already-set var),
//   - no inline-comment stripping (an API key may legitimately contain '#'),
//   - quotes are stripped only when they wrap the whole value.
//
// Idempotent: the first call reads and caches; later calls return the cached result
// (so a script can call it to print a status line without re-parsing).

export type EnvLoadResult = {
  path: string;
  found: boolean;
  loaded: number;
};

let cached: EnvLoadResult | null = null;

export function loadEnvLocal(): EnvLoadResult {
  if (cached) return cached;

  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) {
    cached = { path, found: false, loaded: 0 };
    return cached;
  }

  const text = readFileSync(path, "utf8");
  let loaded = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const unprefixed = line.startsWith("export ") ? line.slice(7) : line;
    const eq = unprefixed.indexOf("=");
    if (eq === -1) continue;

    const key = unprefixed.slice(0, eq).trim();
    if (key === "") continue;

    const value = stripWrappingQuotes(unprefixed.slice(eq + 1).trim());

    // Shell / CI env wins — only fill what isn't already set.
    if (process.env[key] === undefined) {
      process.env[key] = value;
      loaded += 1;
    }
  }

  cached = { path, found: true, loaded };
  return cached;
}

function stripWrappingQuotes(value: string): string {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}
