import "server-only";
import { persistenceMode } from "./persistence";

// The single auth boundary for request-scoped server code. Mirrors the PERSISTENCE
// switch in lib/session.ts: memory mode (default — offline dev, smoke) never touches
// Supabase and gets a fixed local user; supabase mode reads the @supabase/ssr cookie
// session and VALIDATES ownership with the Auth server (always getUser(), never
// getSession(): getSession() trusts the unverified cookie JWT and must not gate
// ownership). The optional AMR proof below uses getClaims(), which verifies the
// token signature and is allowed to affect telemetry only, never ownership.
//
// The Supabase server client is loaded with a dynamic import so this module stays
// importable from plain-node scripts (tsx smoke/check-db) — next/headers only enters
// the module graph when the supabase branch actually runs inside a request.

export const LOCAL_DEV_USER_ID = "local-dev";

export type VerifiedAuthenticationMethod = Readonly<{
  method: string;
  timestamp: number;
}>;

export type AuthUserContext = Readonly<{
  userId: string;
  isAnonymous: boolean;
  authenticationMethods: ReadonlyArray<VerifiedAuthenticationMethod>;
}>;

declare global {
  var __onwardMemoryAuthContextOverride:
    | AuthUserContext
    | null
    | undefined;
}

// Authenticated user id, or null when there is no (valid) auth session. Callers map
// null to 401 (creation paths) or 404 (session-scoped reads, via getOwnedSession).
export async function getAuthUserId(): Promise<string | null> {
  if (persistenceMode() === "memory") {
    return memoryAuthUserContext()?.userId ?? null;
  }

  const { createSupabaseServer } = await import("./supabase/server");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

// The richer context is intentionally used only by the initial match boundary.
// Ordinary owner checks stay on getAuthUserId() and do not pay for claims/AMR
// verification that cannot affect product authorization.
export async function getAuthUserContext(): Promise<AuthUserContext | null> {
  if (persistenceMode() === "memory") {
    return memoryAuthUserContext();
  }

  const { createSupabaseServer } = await import("./supabase/server");
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  // Auth ownership remains available when claims verification has a transient
  // problem; only the observability-only method proof is omitted. getClaims()
  // verifies the JWT and gives us timestamped AMR entries without trusting a
  // browser-selected method.
  let authenticationMethods: ReadonlyArray<VerifiedAuthenticationMethod> =
    Object.freeze([]);
  try {
    const { data: claimData, error: claimError } =
      await supabase.auth.getClaims();
    if (!claimError && claimData?.claims.sub === data.user.id) {
      authenticationMethods = parseVerifiedAuthenticationMethods(
        claimData.claims.amr,
      );
    }
  } catch {
    // A missing AMR proof makes auth telemetry silent, never auth unavailable.
  }

  return Object.freeze({
    userId: data.user.id,
    isAnonymous: data.user.is_anonymous === true,
    authenticationMethods,
  });
}

export function hasFreshAnonymousAuthentication(
  context: AuthUserContext,
  issuedAtSeconds: number,
  now = new Date(),
): boolean {
  if (!context.isAnonymous || !Number.isSafeInteger(issuedAtSeconds)) {
    return false;
  }
  const nowSeconds = Math.floor(now.getTime() / 1000);
  return context.authenticationMethods.some(
    (entry) =>
      entry.method === "anonymous" &&
      entry.timestamp >= issuedAtSeconds - AUTH_METHOD_CLOCK_SKEW_SECONDS &&
      entry.timestamp <= nowSeconds + AUTH_METHOD_CLOCK_SKEW_SECONDS,
  );
}

export function parseVerifiedAuthenticationMethods(
  value: unknown,
): ReadonlyArray<VerifiedAuthenticationMethod> {
  if (!Array.isArray(value)) return Object.freeze([]);
  const methods: VerifiedAuthenticationMethod[] = [];
  for (const entry of value) {
    if (entry === null || typeof entry !== "object") continue;
    const method = (entry as Record<string, unknown>).method;
    const timestamp = (entry as Record<string, unknown>).timestamp;
    if (
      typeof method === "string" &&
      method.length > 0 &&
      typeof timestamp === "number" &&
      Number.isSafeInteger(timestamp) &&
      timestamp >= 0
    ) {
      methods.push(Object.freeze({ method, timestamp }));
    }
  }
  return Object.freeze(methods);
}

// Narrow test seam for the memory persistence adapter. It lets route validators
// exercise the real unauthenticated 401 and authenticated retry without adding
// a production auth configuration mode or mocking Supabase internals.
export function _setMemoryAuthContextForTests(
  value: AuthUserContext | null | undefined,
): void {
  if (persistenceMode() !== "memory") {
    throw new Error("memory auth overrides require memory persistence");
  }
  globalThis.__onwardMemoryAuthContextOverride = value;
}

function memoryAuthUserContext(): AuthUserContext | null {
  if (globalThis.__onwardMemoryAuthContextOverride !== undefined) {
    return globalThis.__onwardMemoryAuthContextOverride;
  }
  return Object.freeze({
    userId: LOCAL_DEV_USER_ID,
    isAnonymous: true,
    authenticationMethods: Object.freeze([
      Object.freeze({
        method: "anonymous",
        timestamp: Math.floor(Date.now() / 1000),
      }),
    ]),
  });
}

const AUTH_METHOD_CLOCK_SKEW_SECONDS = 30;
