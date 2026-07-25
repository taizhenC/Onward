import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { POST as deleteAccountPost } from "../app/api/account-delete/route";
import {
  LOCAL_DEV_USER_ID,
  _setMemoryAuthContextForTests,
  accountDeletionAuthenticationStatus,
  type AccountAuthContext,
} from "../lib/auth";
import { deleteOwnedAccount } from "../lib/account-deletion";
import { deleteMemoryAccount } from "../lib/account-deletion-store-memory";
import {
  ACCOUNT_DELETION_SUCCESS_COOKIE,
  accountDeletionSuccessReceiptDisposition,
  accountDeletionTokenDisposition,
  accountReauthContinuationTokenDisposition,
  accountReauthRequestTokenDisposition,
  issueAccountDeletionToken,
  issueAccountDeletionSuccessReceipt,
  issueAccountReauthContinuationToken,
  issueAccountReauthRequestToken,
} from "../lib/account-deletion-token";
import { issueMatchRecoveryToken } from "../lib/match-recovery-flow";
import { consumeMatchRateLimit } from "../lib/rate-limit";
import {
  activateTelemetryFlowForOwner,
} from "../lib/telemetry-flow-lifecycle";
import {
  createTelemetryFlowId,
  recordProductEvent,
} from "../lib/telemetry";
import { isMemoryTelemetryFlowRevoked } from "../lib/telemetry-flow-state-memory";
import { listMemoryProductEvents } from "../lib/telemetry-store-memory";
import type { ProductEvent } from "../lib/telemetry-types";
import type { Session } from "../lib/types";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";
process.env.TELEMETRY_FLOW_BINDING_ENABLED = "true";

async function main(): Promise<void> {
  const failures: string[] = [];
  checkTokensAndFreshAuth(failures);
  await checkAvailabilityAndTelemetry(failures);
  await checkMemoryAccountGraph(failures);
  await checkRouteContract(failures);
  checkStaticContracts(failures);

  console.log("Onward account deletion validator");
  console.log("=================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} account-deletion failure(s).`);
    process.exit(1);
  }
  console.log("PASS purpose-bound confirmation, reauth proof, and exact native POST");
  console.log("PASS account graph, unbound-flow, recovery, rate-key, and auth cleanup");
  console.log("PASS availability-first unlinkable account deletion telemetry");
  console.log("PASS SQL lock order, FK race closure, guest parity, grants, and residual copy");
}

function checkTokensAndFreshAuth(failures: string[]): void {
  const now = new Date("2026-07-17T12:00:00.000Z");
  const deletion = issueAccountDeletionToken(LOCAL_DEV_USER_ID, now);
  const reauth = issueAccountReauthRequestToken(LOCAL_DEV_USER_ID, now);
  const continuation = issueAccountReauthContinuationToken(
    LOCAL_DEV_USER_ID,
    now,
  );
  const successReceipt = issueAccountDeletionSuccessReceipt(now);
  if (
    accountDeletionTokenDisposition(deletion, LOCAL_DEV_USER_ID, now) !==
      "valid" ||
    accountDeletionTokenDisposition(deletion, "another-user", now) !==
      "invalid" ||
    accountDeletionTokenDisposition(tamperToken(deletion), LOCAL_DEV_USER_ID, now) !==
      "invalid" ||
    accountDeletionTokenDisposition(
      deletion,
      LOCAL_DEV_USER_ID,
      new Date(now.getTime() + 12 * 60_000),
    ) !== "expired" ||
    accountReauthRequestTokenDisposition(
      deletion,
      LOCAL_DEV_USER_ID,
      now,
    ) !== "invalid" ||
    accountReauthRequestTokenDisposition(reauth, LOCAL_DEV_USER_ID, now) !==
      "valid" ||
    accountReauthContinuationTokenDisposition(
      continuation,
      LOCAL_DEV_USER_ID,
      now,
    ) !== "valid" ||
    accountDeletionSuccessReceiptDisposition(successReceipt, now) !== "valid" ||
    accountDeletionSuccessReceiptDisposition(tamperToken(successReceipt), now) !==
      "invalid" ||
    accountDeletionSuccessReceiptDisposition(
      successReceipt,
      new Date(now.getTime() + 4 * 60_000),
    ) !== "expired" ||
    accountDeletionTokenDisposition(successReceipt, LOCAL_DEV_USER_ID, now) !==
      "invalid"
  ) {
    failures.push("account-action tokens were not owner/purpose/expiry bound");
  }

  const seconds = Math.floor(now.getTime() / 1000);
  const base = {
    userId: "00000000-0000-4000-8000-000000000001",
    isAnonymous: false,
    email: "reader@example.com",
    authenticationProofAvailable: true,
  } as const;
  const statusCases: Array<[AccountAuthContext, string]> = [
    [
      { ...base, authenticationMethods: [{ method: "password", timestamp: seconds }] },
      "fresh",
    ],
    [
      { ...base, authenticationMethods: [{ method: "otp", timestamp: seconds - 700 }] },
      "stale",
    ],
    [
      { ...base, authenticationMethods: [{ method: "oauth", timestamp: seconds }] },
      "stale",
    ],
    [
      { ...base, authenticationProofAvailable: false, authenticationMethods: [] },
      "unavailable",
    ],
    [
      { ...base, isAnonymous: true, email: null, authenticationMethods: [] },
      "guest",
    ],
  ];
  if (
    statusCases.some(
      ([context, expected]) =>
        accountDeletionAuthenticationStatus(context, now) !== expected,
    )
  ) {
    failures.push("account deletion did not enforce fresh password/otp proof");
  }
}

async function checkAvailabilityAndTelemetry(
  failures: string[],
): Promise<void> {
  let deleted = false;
  let syntheticNow = 1_000;
  const events: ProductEvent[] = [];
  const result = await deleteOwnedAccount(
    { userId: LOCAL_DEV_USER_ID, deletionRequestSeed: issueAccountDeletionToken(LOCAL_DEV_USER_ID) },
    {
      deleteAccount: async () => {
        deleted = true;
        syntheticNow += 200;
        return "deleted";
      },
      now: () => syntheticNow,
      recordEvent: async (event) => {
        if (!deleted) throw new Error("telemetry ran before deletion");
        events.push(event);
      },
    },
  );
  const request = events.find((event) => event.event === "deletion_requested");
  const completion = events.find((event) => event.event === "deletion_completed");
  if (
    result !== "deleted" ||
    request?.event !== "deletion_requested" ||
    request.scope !== "account" ||
    completion?.event !== "deletion_completed" ||
    completion.scope !== "account" ||
    completion.deletionId !== request.deletionId ||
    completion.latencyBucket !== "lt250ms"
  ) {
    failures.push("account deletion telemetry was not post-confirmation/unlinkable");
  }

  let hungAttempts = 0;
  const startedAt = Date.now();
  const hung = await deleteOwnedAccount(
    { userId: LOCAL_DEV_USER_ID },
    {
      deleteAccount: async () => "deleted",
      recordEvent: () => {
        hungAttempts += 1;
        return new Promise(() => undefined);
      },
    },
  );
  if (
    hung !== "deleted" ||
    hungAttempts !== 1 ||
    Date.now() - startedAt > 750
  ) {
    failures.push("hung telemetry delayed or prevented account deletion");
  }

  let notFoundEvents = 0;
  const missing = await deleteOwnedAccount(
    { userId: LOCAL_DEV_USER_ID },
    {
      deleteAccount: async () => "not_found",
      recordEvent: async () => {
        notFoundEvents += 1;
      },
    },
  );
  if (missing !== "not_found" || notFoundEvents !== 0) {
    failures.push("account-deletion replay emitted duplicate telemetry");
  }
}

async function checkMemoryAccountGraph(failures: string[]): Promise<void> {
  const userId = LOCAL_DEV_USER_ID;
  const rootId = "a".repeat(32);
  const alternateId = "b".repeat(32);
  const flowId = createTelemetryFlowId();
  await activateTelemetryFlowForOwner(flowId, userId);
  await recordProductEvent({ event: { event: "intake_submitted" }, flowId });
  await issueMatchRecoveryToken(
    userId,
    { age: 22, feeling: "I feel stuck", telemetryFlowId: null },
    "clarification",
  );
  await consumeMatchRateLimit(userId, "c".repeat(64));

  const root = makeSession(rootId, userId, null, "artifact-root");
  const alternate = makeSession(
    alternateId,
    userId,
    rootId,
    "artifact-alternate",
  );
  globalThis.__onwardSessions?.set(rootId, root);
  globalThis.__onwardSessions?.set(alternateId, alternate);
  globalThis.__onwardStoryArtifacts?.set(
    "artifact-root",
    { sessionId: rootId, userId, artifact: {} } as never,
  );
  globalThis.__onwardStoryArtifacts?.set(
    "artifact-alternate",
    { sessionId: alternateId, userId, artifact: {} } as never,
  );
  globalThis.__onwardResonanceFeedback?.set(rootId, {} as never);
  globalThis.__onwardAlternateStoryFlows?.set(rootId, {} as never);

  await deleteMemoryAccount(userId);
  const linkedEventsRemain = listMemoryProductEvents().some(
    (event) => event.flowId === flowId,
  );
  const userRateKeyRemains = [...(globalThis.__onwardRateLimits?.keys() ?? [])].some(
    (key) => key.startsWith(`u:${userId}:`),
  );
  if (
    globalThis.__onwardSessions?.has(rootId) ||
    globalThis.__onwardSessions?.has(alternateId) ||
    globalThis.__onwardStoryArtifacts?.has("artifact-root") ||
    globalThis.__onwardStoryArtifacts?.has("artifact-alternate") ||
    globalThis.__onwardResonanceFeedback?.has(rootId) ||
    globalThis.__onwardAlternateStoryFlows?.has(rootId) ||
    (globalThis.__onwardMatchRecoveryFlows?.size ?? 0) !== 0 ||
    !isMemoryTelemetryFlowRevoked(flowId) ||
    linkedEventsRemain ||
    userRateKeyRemains
  ) {
    failures.push("memory account cascade left owner-linked state behind");
  }
}

async function checkRouteContract(failures: string[]): Promise<void> {
  _setMemoryAuthContextForTests(null);
  const signedOut = await deleteAccountPost(
    accountRequest("csrfToken=x&intent=delete_account"),
  );
  if (signedOut.status !== 303 || !signedOut.headers.get("location")?.endsWith("/signin")) {
    failures.push("signed-out account deletion did not recover through sign-in");
  }

  _setMemoryAuthContextForTests({
    userId: LOCAL_DEV_USER_ID,
    isAnonymous: false,
    authenticationMethods: [
      { method: "password", timestamp: Math.floor(Date.now() / 1000) - 900 },
    ],
  });
  const staleToken = issueAccountDeletionToken(LOCAL_DEV_USER_ID);
  const stale = await deleteAccountPost(
    accountRequest(validBody(staleToken)),
  );
  if (
    stale.status !== 303 ||
    !stale.headers.get("location")?.includes("/account/delete?error=reauth")
  ) {
    failures.push("stale permanent auth was allowed to delete an account");
  }

  _setMemoryAuthContextForTests({
    userId: LOCAL_DEV_USER_ID,
    isAnonymous: true,
    authenticationMethods: [],
  });
  const token = issueAccountDeletionToken(LOCAL_DEV_USER_ID);
  const missingUnderstanding = await deleteAccountPost(
    accountRequest(`csrfToken=${encodeURIComponent(token)}&intent=delete_account`),
  );
  const wrongOrigin = await deleteAccountPost(
    accountRequest(validBody(token), "https://attacker.example"),
  );
  const success = await deleteAccountPost(accountRequest(validBody(token)));
  const successCookie = success.headers.get("set-cookie") ?? "";
  if (
    missingUnderstanding.status !== 303 ||
    !missingUnderstanding.headers.get("location")?.includes("error=understood") ||
    wrongOrigin.status !== 403 ||
    success.status !== 303 ||
    !success.headers.get("location")?.endsWith("/account-deleted") ||
    !successCookie.includes(`${ACCOUNT_DELETION_SUCCESS_COOKIE}=ads_`) ||
    !successCookie.includes("Max-Age=120") ||
    !successCookie.includes("Path=/account-deleted") ||
    !successCookie.includes("HttpOnly")
  ) {
    failures.push("account deletion route did not enforce origin/form/PRG contract");
  }
  _setMemoryAuthContextForTests(undefined);
}

function checkStaticContracts(failures: string[]): void {
  const migration = source("../supabase/migrations/0019_owned_account_deletion.sql");
  const route = source("../app/api/account-delete/route.ts");
  const reauthRoute = source("../app/api/account-delete/reauth/route.ts");
  const confirm = source("../app/auth/confirm/route.ts");
  const page = source("../app/account/delete/page.tsx");
  const successPage = source("../app/account-deleted/page.tsx");
  const privacyPage = source("../app/privacy/page.tsx");
  const accountPage = source("../app/account/page.tsx");
  const saveStoriesCard = source("../components/SaveStoriesCard.tsx");
  const setPasswordForm = source("../components/SetPasswordForm.tsx");
  const middleware = source("../lib/supabase/middleware.ts");
  const navigationStatus = source("../components/NavigationStatus.tsx");
  const globals = source("../app/globals.css");
  const config = source("../next.config.ts");
  const store = source("../lib/account-deletion-store-supabase.ts");
  const internalStart = migration.indexOf(
    "create or replace function public.delete_owned_account_internal_v1",
  );
  const internalEnd = migration.indexOf(
    "create or replace function public.delete_owned_account_v1",
    internalStart + 1,
  );
  const internalBoundary =
    internalStart >= 0 && internalEnd > internalStart
      ? migration.slice(internalStart, internalEnd)
      : "";
  const orderedBoundaryFragments = [
    "'onward-account-delete:'",
    "and owned.alternate_of_session_id is null",
    "order by owned.session_id\n  for update;",
    "order by flow.flow_id\n  for update;",
    "from auth.users guest\n  where guest.id = p_user_id\n  for update;",
    "if p_guest_cutoff is not null then",
    "delete from public.telemetry_flows",
    "delete from auth.users",
  ];
  const orderedBoundaryPositions = orderedBoundaryFragments.map((fragment) =>
    internalBoundary.indexOf(fragment),
  );
  const accountBoundaryOrderIsSafe = orderedBoundaryPositions.every(
    (position, index) =>
      position >= 0 &&
      (index === 0 || position > orderedBoundaryPositions[index - 1]!),
  );
  const required: Array<readonly [string, boolean]> = [
    [
      "rate-limit ownership cascade",
      migration.includes("generated always as") &&
        migration.includes("references auth.users (id) on delete cascade"),
    ],
    [
      "indexed rate-limit ownership cascade",
      migration.includes("create index rate_limits_owner_user_id_idx") &&
        migration.includes("where owner_user_id is not null"),
    ],
    [
      "account lock order and flow retirement",
      accountBoundaryOrderIsSafe,
    ],
    [
      "account-serialized owner-claim and initial-story writers",
      migration.includes(
        "rename to claim_telemetry_flow_owner_v1_unserialized",
      ) &&
        migration.includes("rename to create_story_session_v2_unserialized") &&
        migration.includes("rename to create_story_session_v3_unserialized") &&
        migration.includes("rename to create_story_session_v4_unserialized") &&
        migration.includes(
          "claim_telemetry_flow_owner_v1_unserialized(text, uuid)",
        ) &&
        migration.includes(
          "create_story_session_v2_unserialized(\n  text, uuid",
        ) &&
        migration.includes(
          "create_story_session_v3_unserialized(\n  text, uuid",
        ) &&
        migration.includes(
          "create_story_session_v4_unserialized(\n  text, uuid",
        ) &&
        migration.match(/'onward-account-delete:'/g)?.length === 5 &&
        migration.includes("notify pgrst, 'reload schema'"),
    ],
    [
      "shared account/guest deletion boundary",
      migration.includes("delete from auth.users") &&
        migration.includes(
          "select public.delete_owned_account_internal_v1(p_user_id, null)",
        ) &&
        migration.includes(
          "perform public.delete_owned_account_internal_v1(v_user_id, v_cutoff)",
        ),
    ],
    [
      "locked guest eligibility recheck",
      migration.includes("v_cutoff timestamptz") &&
        internalBoundary.includes("v_is_anonymous is distinct from true") &&
        internalBoundary.includes("v_user_created_at >= p_guest_cutoff") &&
        internalBoundary.includes("owned.updated_at > p_guest_cutoff") &&
        accountBoundaryOrderIsSafe,
    ],
    [
      "private internal deletion helper",
      migration.includes(
        "revoke all on function public.delete_owned_account_internal_v1(uuid, timestamptz)",
      ) && migration.includes("from public, anon, authenticated, service_role"),
    ],
    [
      "service-only deletion grant",
      migration.includes(
        "grant execute on function public.delete_owned_account_v1(uuid)",
      ) && migration.includes("to service_role"),
    ],
    [
      "exact owner-derived POST",
      !route.includes('form.get("userId")') &&
        route.includes('form.get("understood")') &&
        route.includes('scope: "local"') === false,
    ],
    [
      "same-device reauthentication cookie",
      reauthRoute.includes("shouldCreateUser: false") &&
        reauthRoute.includes("httpOnly: true") &&
        reauthRoute.includes('path: "/auth/confirm"'),
    ],
    [
      "reauthentication continuation",
      confirm.includes("accountReauthContinuationTokenDisposition") &&
        confirm.includes('redirect("/account/delete")'),
    ],
    [
      "confirmation residual/privacy copy",
      page.includes("Information already processed by model providers") &&
        page.includes("Historical concern") &&
        page.includes("reports stay") &&
        page.includes('method="post"') &&
        page.includes('/privacy#retention-after-deletion'),
    ],
    [
      "account-wide guest retention copy",
      saveStoriesCard.includes("account and every story in it are deleted") &&
        saveStoriesCard.includes("latest story creation or saved reading progress") &&
        accountPage.includes("account and every story in it are deleted") &&
        accountPage.includes("latest story creation or saved reading") &&
        page.includes("account and every story in it are deleted") &&
        privacyPage.includes("account and every story in it are deleted"),
    ],
    [
      "historical-record identifier distinction",
      page.includes("historical-library source, story-template") &&
        page.includes("no account, session, saved-story") &&
        successPage.includes("historical-library source, story-template") &&
        successPage.includes("no account, session, saved-story") &&
        privacyPage.includes("historical-library source, story-template") &&
        privacyPage.includes("account, session, saved-story, artifact"),
    ],
    [
      "receipt-gated success page",
      successPage.includes("accountDeletionSuccessReceiptDisposition") &&
        successPage.includes("getAccountAuthContext") &&
        successPage.includes('/privacy#retention-after-deletion') &&
        !successPage.includes("<NavigationStatus className=\"space-y-3"),
    ],
    [
      "first-view receipt consumption",
      middleware.includes('request.nextUrl.pathname === "/account-deleted"') &&
        middleware.includes(
          'request.cookies.has("onward_account_delete_success")',
        ) &&
        middleware.includes("maxAge: 0") &&
        middleware.includes('path: "/account-deleted"'),
    ],
    [
      "semantic status and AA accent",
      navigationStatus.includes("useRef<HTMLDivElement>") &&
        navigationStatus.includes("<div") &&
        themeContrastRatio(globals, "accent", "bg") >= 4.5,
    ],
    [
      "visible programmatic password feedback focus",
      setPasswordForm.includes("tabIndex={-1}") &&
        setPasswordForm.match(/focus:ring-2/g)?.length === 2,
    ],
    [
      "plain-language privacy guide",
      privacyPage.includes("The short version") &&
        privacyPage.includes('id="retention-after-deletion"') &&
        privacyPage.includes("Account-free records can remain") &&
        privacyPage.includes("30-day") &&
        privacyPage.includes("formal") &&
        privacyPage.includes("privacy review") &&
        privacyPage.includes("before public launch") &&
        privacyPage.includes('href="/account"') &&
        privacyPage.includes('href="/signin"') &&
        accountPage.includes('href="/privacy"'),
    ],
    [
      "private no-store account headers",
      config.includes('source: "/account/:path*"') &&
        config.includes("private, no-store, max-age=0"),
    ],
    [
      "ambiguous-response reconciliation",
      store.includes("const replay = await callAccountDeletion(userId)") &&
        store.includes("auth.admin.getUserById"),
    ],
  ];
  const missing = required
    .filter(([, present]) => !present)
    .map(([name]) => name);
  if (missing.length > 0) {
    failures.push(
      `account deletion static contracts drifted: ${missing.join(", ")}`,
    );
  }
}

function makeSession(
  sessionId: string,
  userId: string,
  alternateOfSessionId: string | null,
  storyArtifactId: string,
): Session {
  const now = Date.now();
  return {
    sessionId,
    userId,
    figureKey: "test",
    stageId: "stage",
    storyArtifactId,
    framing: "partial",
    openingCopy: { eyebrow: "", prefaceLines: [] },
    age: alternateOfSessionId ? null : 22,
    feeling: alternateOfSessionId ? null : "test",
    storyRequestContext: null,
    disclosureExpiresAt: now + 60_000,
    alternateOfSessionId,
    matchRecipe: {} as Session["matchRecipe"],
    nextBeatIndex: 0,
    nextChunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function accountRequest(body: string, origin = "https://onward.test"): Request {
  return new Request("https://onward.test/api/account-delete", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin,
      "sec-fetch-site": origin === "https://onward.test" ? "same-origin" : "cross-site",
    },
    body,
  });
}

function validBody(token: string): string {
  return new URLSearchParams({
    csrfToken: token,
    intent: "delete_account",
    understood: "delete_account_and_stories",
  }).toString();
}

function tamperToken(token: string): string {
  const last = token.at(-1);
  return `${token.slice(0, -1)}${last === "A" ? "B" : "A"}`;
}

function source(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

function themeContrastRatio(
  css: string,
  foreground: string,
  background: string,
): number {
  const foregroundHex = themeHex(css, foreground);
  const backgroundHex = themeHex(css, background);
  if (!foregroundHex || !backgroundHex) return 0;
  const foregroundLuminance = relativeLuminance(foregroundHex);
  const backgroundLuminance = relativeLuminance(backgroundHex);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function themeHex(css: string, name: string): string | null {
  return new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i").exec(css)?.[1] ?? null;
}

function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [value >> 16, value >> 8, value].map(
    (channel) => channel & 0xff,
  );
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
