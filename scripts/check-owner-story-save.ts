import "./_smoke-bootstrap";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deleteMemoryAccount } from "../lib/account-deletion-store-memory";
import {
  DERIVED_OUTPUT_RETENTION_POLICY_VERSION,
  DERIVED_OUTPUT_SURFACES,
  PERSISTENCE_RETENTION_REGISTRY,
} from "../lib/derived-output-retention";
import {
  _clearMemoryOwnerStorySaveStatesForTests,
  _recordLegacyMemoryOwnerStorySaveForTests,
  _recordMemoryOwnerStorySaveTransitionForTests,
  getMemoryOwnerStorySaveState,
} from "../lib/owner-story-save-store-memory";
import {
  canOwnerCreateStory,
  getOwnerStorySavePresentation,
} from "../lib/owner-story-save";
import {
  LEGACY_OWNER_STORY_SAVE_POLICY_VERSION,
  OWNER_STORY_SAVE_EVIDENCE_KINDS,
  OWNER_STORY_SAVE_POLICY_VERSION,
  OWNER_STORY_SAVE_RETENTION_POLICY_VERSION,
  parseOwnerStorySaveState,
} from "../lib/owner-story-save-types";
import { deleteOwnedStory } from "../lib/story-deletion";

process.env.PERSISTENCE = "memory";
process.env.LLM_PROVIDER = "stub";

const CURRENT_TIME = "2026-07-27T14:15:16.000Z";
const CURRENT_TIME_MS = Date.parse(CURRENT_TIME);
const OWNER_A = "owner-save-check-a";
const OWNER_B = "owner-save-check-b";

async function main(): Promise<void> {
  const failures: string[] = [];
  checkClosedParser(failures);
  await checkProjectionMatrix(failures);
  checkMemoryFirstEvidenceWins(failures);
  await checkDeletionBoundaries(failures);
  checkSupabaseReadBoundary(failures);
  checkMigrationContract(failures);
  checkTelemetryReservation(failures);
  checkAuthoritativeUi(failures);
  checkIntegrationWiring(failures);

  console.log("Onward durable Owner Story Save validator");
  console.log("=========================================");
  if (failures.length > 0) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    console.error(`${failures.length} owner-story-save failure(s).`);
    process.exit(1);
  }
  console.log("PASS exact immutable Save State parser and first-evidence-wins memory seam");
  console.log("PASS temporary/saved/legacy/integrity-failure presentation matrix");
  console.log("PASS Auth-bound atomic SQL, legacy honesty, default-deny, and health proof");
  console.log("PASS account-wide deletion boundary and story-deletion independence");
  console.log("PASS returning-only sign-in and server-authoritative Save UI");
  console.log("PASS save/reopen telemetry remains a non-producing contract reservation");
}

function checkClosedParser(failures: string[]): void {
  const currentRow = {
    user_id: OWNER_A,
    saved_at: CURRENT_TIME,
    observed_at: CURRENT_TIME,
    evidence_kind: "anonymous_upgrade",
    save_policy_version: OWNER_STORY_SAVE_POLICY_VERSION,
    retention_policy_version: OWNER_STORY_SAVE_RETENTION_POLICY_VERSION,
    retention_class: "owned_story",
  };
  const current = parseOwnerStorySaveState(currentRow, OWNER_A);
  const legacy = parseOwnerStorySaveState(
    {
      ...currentRow,
      saved_at: null,
      evidence_kind: "legacy_permanent_observed",
      save_policy_version: LEGACY_OWNER_STORY_SAVE_POLICY_VERSION,
    },
    OWNER_A,
  );

  if (
    OWNER_STORY_SAVE_EVIDENCE_KINDS.join(",") !==
      "anonymous_upgrade,legacy_permanent_observed" ||
    !Object.isFrozen(OWNER_STORY_SAVE_EVIDENCE_KINDS) ||
    current.savedAt !== CURRENT_TIME_MS ||
    current.observedAt !== CURRENT_TIME_MS ||
    current.evidenceKind !== "anonymous_upgrade" ||
    legacy.savedAt !== null ||
    legacy.evidenceKind !== "legacy_permanent_observed" ||
    current.retention.retentionClass !== "owned_story" ||
    current.retention.policyVersion !==
      DERIVED_OUTPUT_RETENTION_POLICY_VERSION ||
    !Object.isFrozen(current) ||
    !Object.isFrozen(current.retention) ||
    !Object.isFrozen(legacy)
  ) {
    failures.push("valid current/legacy evidence did not parse to exact frozen values");
  }

  const invalidRows: Array<[string, unknown, string]> = [
    ["extra field", { ...currentRow, extra: true }, OWNER_A],
    [
      "missing field",
      Object.fromEntries(
        Object.entries(currentRow).filter(([key]) => key !== "retention_class"),
      ),
      OWNER_A,
    ],
    ["wrong owner", currentRow, OWNER_B],
    ["non-object", null, OWNER_A],
    ["array", [], OWNER_A],
    ["bad observed timestamp", { ...currentRow, observed_at: "never" }, OWNER_A],
    [
      "mismatched timestamp",
      { ...currentRow, saved_at: "2026-07-27T14:15:17.000Z" },
      OWNER_A,
    ],
    [
      "current without save time",
      { ...currentRow, saved_at: null },
      OWNER_A,
    ],
    [
      "legacy with fabricated save time",
      {
        ...currentRow,
        evidence_kind: "legacy_permanent_observed",
        save_policy_version: LEGACY_OWNER_STORY_SAVE_POLICY_VERSION,
      },
      OWNER_A,
    ],
    [
      "wrong current policy",
      { ...currentRow, save_policy_version: "future-policy" },
      OWNER_A,
    ],
    [
      "wrong retention policy",
      { ...currentRow, retention_policy_version: "future-retention" },
      OWNER_A,
    ],
    [
      "wrong retention class",
      { ...currentRow, retention_class: "request_ephemeral" },
      OWNER_A,
    ],
    [
      "unknown evidence",
      { ...currentRow, evidence_kind: "email_sent" },
      OWNER_A,
    ],
    [
      "direct account creation without informed Save",
      { ...currentRow, evidence_kind: "permanent_account_created" },
      OWNER_A,
    ],
  ];
  for (const [label, value, expectedUserId] of invalidRows) {
    if (!throws(() => parseOwnerStorySaveState(value, expectedUserId))) {
      failures.push(`exact Save State parser accepted ${label}`);
    }
  }
}

async function checkProjectionMatrix(failures: string[]): Promise<void> {
  _clearMemoryOwnerStorySaveStatesForTests();
  const anonymousWithoutEvidence = await getOwnerStorySavePresentation({
    userId: OWNER_A,
    isAnonymous: true,
  });
  const permanentWithoutEvidence = await getOwnerStorySavePresentation({
    userId: OWNER_A,
    isAnonymous: false,
  });
  const anonymousCanCreate = await canOwnerCreateStory({
    userId: OWNER_A,
    isAnonymous: true,
  });
  const uncoveredPermanentCanCreate = await canOwnerCreateStory({
    userId: OWNER_A,
    isAnonymous: false,
  });

  _recordMemoryOwnerStorySaveTransitionForTests({
    userId: OWNER_A,
    evidenceKind: "anonymous_upgrade",
    occurredAt: CURRENT_TIME_MS,
  });
  const currentPermanent = await getOwnerStorySavePresentation({
    userId: OWNER_A,
    isAnonymous: false,
  });
  const currentPermanentCanCreate = await canOwnerCreateStory({
    userId: OWNER_A,
    isAnonymous: false,
  });
  const impossibleAnonymous = await getOwnerStorySavePresentation({
    userId: OWNER_A,
    isAnonymous: true,
  });

  _recordLegacyMemoryOwnerStorySaveForTests({
    userId: OWNER_B,
    observedAt: CURRENT_TIME_MS,
  });
  const legacyPermanent = await getOwnerStorySavePresentation({
    userId: OWNER_B,
    isAnonymous: false,
  });
  const legacyPermanentCanCreate = await canOwnerCreateStory({
    userId: OWNER_B,
    isAnonymous: false,
  });

  if (
    anonymousWithoutEvidence.status !== "temporary" ||
    !anonymousCanCreate ||
    permanentWithoutEvidence.status !== "unavailable" ||
    permanentWithoutEvidence.reason !== "integrity_conflict" ||
    uncoveredPermanentCanCreate ||
    currentPermanent.status !== "saved" ||
    currentPermanent.evidence !== "current" ||
    !currentPermanentCanCreate ||
    legacyPermanent.status !== "saved" ||
    legacyPermanent.evidence !== "legacy" ||
    !legacyPermanentCanCreate ||
    impossibleAnonymous.status !== "unavailable" ||
    impossibleAnonymous.reason !== "integrity_conflict" ||
    [
      anonymousWithoutEvidence,
      permanentWithoutEvidence,
      currentPermanent,
      legacyPermanent,
      impossibleAnonymous,
    ].some((value) => !Object.isFrozen(value))
  ) {
    failures.push("owner lifecycle did not project the closed temporary/saved/unavailable matrix");
  }
}

function checkMemoryFirstEvidenceWins(failures: string[]): void {
  _clearMemoryOwnerStorySaveStatesForTests();
  const first = _recordMemoryOwnerStorySaveTransitionForTests({
    userId: OWNER_A,
    evidenceKind: "anonymous_upgrade",
    occurredAt: CURRENT_TIME_MS,
  });
  const replay = _recordMemoryOwnerStorySaveTransitionForTests({
    userId: OWNER_A,
    evidenceKind: "anonymous_upgrade",
    occurredAt: CURRENT_TIME_MS + 60_000,
  });
  const legacyAttempt = _recordLegacyMemoryOwnerStorySaveForTests({
    userId: OWNER_A,
    observedAt: CURRENT_TIME_MS + 120_000,
  });
  const isolated = getMemoryOwnerStorySaveState(OWNER_B);

  _recordLegacyMemoryOwnerStorySaveForTests({
    userId: OWNER_B,
    observedAt: CURRENT_TIME_MS + 5_000,
  });
  const currentAfterLegacy = _recordMemoryOwnerStorySaveTransitionForTests({
    userId: OWNER_B,
    evidenceKind: "anonymous_upgrade",
    occurredAt: CURRENT_TIME_MS + 10_000,
  });
  const reread = getMemoryOwnerStorySaveState(OWNER_A);

  if (
    first.evidenceKind !== "anonymous_upgrade" ||
    replay.evidenceKind !== first.evidenceKind ||
    replay.savedAt !== first.savedAt ||
    legacyAttempt.evidenceKind !== first.evidenceKind ||
    isolated !== null ||
    currentAfterLegacy.evidenceKind !== "legacy_permanent_observed" ||
    currentAfterLegacy.savedAt !== null ||
    reread?.savedAt !== first.savedAt ||
    reread === first ||
    !Object.isFrozen(reread) ||
    !Object.isFrozen(reread?.retention)
  ) {
    failures.push("memory Save State was not isolated, immutable, or first-evidence-wins");
  }
  if (
    !throws(() =>
      _recordMemoryOwnerStorySaveTransitionForTests({
        userId: "",
        evidenceKind: "anonymous_upgrade",
        occurredAt: CURRENT_TIME_MS,
      }),
    ) ||
    !throws(() =>
      _recordLegacyMemoryOwnerStorySaveForTests({
        userId: "owner-save-check-invalid",
        observedAt: Number.NaN,
      }),
    )
  ) {
    failures.push("memory Save State accepted an invalid transition");
  }
}

async function checkDeletionBoundaries(failures: string[]): Promise<void> {
  _clearMemoryOwnerStorySaveStatesForTests();
  _recordMemoryOwnerStorySaveTransitionForTests({
    userId: OWNER_A,
    evidenceKind: "anonymous_upgrade",
    occurredAt: CURRENT_TIME_MS,
  });
  const storyResult = await deleteOwnedStory(
    {
      sessionId: "a".repeat(32),
      userId: OWNER_A,
    },
    {
      deleteSession: async () => "deleted",
      recordEvent: async () => undefined,
    },
  );
  const afterStoryDelete = getMemoryOwnerStorySaveState(OWNER_A);
  await deleteMemoryAccount(OWNER_A);
  const afterAccountDelete = getMemoryOwnerStorySaveState(OWNER_A);
  if (
    storyResult !== "deleted" ||
    afterStoryDelete?.evidenceKind !== "anonymous_upgrade" ||
    afterAccountDelete !== null
  ) {
    failures.push("story deletion changed account Save State or account deletion left it behind");
  }

  const storyDeletion = read("../lib/story-deletion.ts");
  const storyStore = read("../lib/session-store-memory.ts");
  const accountStore = read("../lib/account-deletion-store-memory.ts");
  const storyMigration = read("../supabase/migrations/0018_owned_story_deletion.sql");
  const accountMigration = read("../supabase/migrations/0019_owned_account_deletion.sql");
  if (
    /ownerStorySave|owner_story_save_states/i.test(storyDeletion) ||
    /ownerStorySave|owner_story_save_states/i.test(storyStore) ||
    /owner_story_save_states|delete\s+from\s+auth\.users/i.test(storyMigration) ||
    !accountStore.includes("deleteMemoryOwnerStorySaveStateForUser") ||
    !/delete\s+from\s+auth\.users/i.test(accountMigration)
  ) {
    failures.push("static deletion seams do not preserve story-level and account-level boundaries");
  }
}

function checkSupabaseReadBoundary(failures: string[]): void {
  const store = stripComments(read("../lib/owner-story-save-store-supabase.ts"));
  const boundary = stripComments(read("../lib/owner-story-save.ts"));
  const expectedSelect =
    "user_id,saved_at,observed_at,evidence_kind,save_policy_version,retention_policy_version,retention_class";
  if (
    !store.includes('.from("owner_story_save_states")') ||
    !store.includes(`"${expectedSelect}"`) ||
    !store.includes('.eq("user_id", userId)') ||
    !store.includes(".maybeSingle()") ||
    !store.includes("parseOwnerStorySaveState(") ||
    /\.(?:insert|upsert|update|delete)\s*\(/.test(store) ||
    /\.rpc\s*\(/.test(store) ||
    !boundary.includes('assertRetentionSink("owner.save_state", "request_memory")') ||
    !boundary.includes('assertRetentionSink("owner.save_state", "owner_response")') ||
    !boundary.includes('reason: "read_error"') ||
    !boundary.includes('reason: "integrity_conflict"')
  ) {
    failures.push("Supabase Save State seam is not an exact read-only, retention-gated boundary");
  }
}

function checkMigrationContract(failures: string[]): void {
  const rawMigration = read("../supabase/migrations/0022_owner_story_save_states.sql");
  const migration = stripComments(rawMigration);
  const normalized = normalizeSql(migration);
  const authBody = extractFunctionBody(
    migration,
    "record_owner_story_save_from_auth_v1",
  );
  const immutableBody = extractFunctionBody(
    migration,
    "reject_owner_story_save_state_update_v1",
  );
  const healthDefinition = extractFunctionDefinition(
    migration,
    "owner_story_save_schema_health_v1",
  );
  const healthHeader = healthDefinition.slice(
    0,
    Math.max(0, healthDefinition.indexOf("as $fn$")),
  );
  const healthColumns =
    /returns\s+table\s*\(([\s\S]*?)\)\s*language\s+sql/i.exec(healthHeader)?.[1] ??
    "";
  const tableDefinition =
    /create\s+table\s+public\.owner_story_save_states\s*\(([\s\S]*?)\n\);/i.exec(
      migration,
    )?.[1] ?? "";
  const tableColumns = splitTopLevelSqlList(tableDefinition)
    .map((entry) => /^([a-z_][a-z0-9_]*)\b/i.exec(entry.trim())?.[1] ?? "")
    .filter((name) => name.length > 0 && name !== "constraint");
  const expectedTableColumns = [
    "user_id",
    "saved_at",
    "observed_at",
    "evidence_kind",
    "save_policy_version",
    "retention_policy_version",
    "retention_class",
  ];

  const requiredSchema = [
    "create table public.owner_story_save_states",
    "user_id uuid primary key",
    "saved_at timestamptz",
    "observed_at timestamptz not null default statement_timestamp()",
    "evidence_kind text not null",
    "save_policy_version text not null",
    "retention_policy_version text not null default 'derived-output-retention-v1-2026-07'",
    "retention_class text not null default 'owned_story'",
    "alter table public.owner_story_save_states enable row level security",
    "alter table public.owner_story_save_states force row level security",
    "revoke all on table public.owner_story_save_states from public, anon, authenticated, service_role",
    "grant select on table public.owner_story_save_states to service_role",
    "before update on public.owner_story_save_states",
  ];
  if (
    tableDefinition.length === 0 ||
    tableColumns.join(",") !== expectedTableColumns.join(",") ||
    /references\s+auth\.users/i.test(tableDefinition) ||
    requiredSchema.some(
      (fragment) => !normalized.includes(normalizeSql(fragment)),
    ) ||
    /grant\s+(?:insert|update|delete|truncate|references|trigger)\s+on\s+table\s+public\.owner_story_save_states/i.test(
      migration,
    ) ||
    !normalizeSql(immutableBody).includes(
      "raise exception 'owner story save state is immutable'",
    )
  ) {
    failures.push("0022 lacks immutable FK-cascaded storage, exact defaults, or default-deny grants");
  }

  const requiredEvidence = [
    "evidence_kind = 'anonymous_upgrade'",
    "saved_at is not null",
    "saved_at = observed_at",
    "save_policy_version = 'durable-account-save-v1-2026-07'",
    "evidence_kind = 'legacy_permanent_observed'",
    "saved_at is null",
    "save_policy_version = 'legacy-pre-durable-save-v0'",
    "retention_policy_version = 'derived-output-retention-v1-2026-07'",
    "retention_class = 'owned_story'",
  ];
  if (
    requiredEvidence.some(
      (fragment) => !normalizeSql(tableDefinition).includes(normalizeSql(fragment)),
    ) ||
    /permanent_account_created/i.test(tableDefinition)
  ) {
    failures.push("0022 constraints do not close current, legacy, and retention evidence");
  }

  const normalizedAuthBody = normalizeSql(authBody);
  const authStatements = stripSqlStringLiterals(authBody);
  const requiredAuthBody = [
    "old.is_anonymous is not true or new.is_anonymous is true",
    "insert into public.owner_story_save_states",
    "new.id, v_now, v_now, 'anonymous_upgrade'",
    "'durable-account-save-v1-2026-07'",
    "'derived-output-retention-v1-2026-07'",
    "'owned_story'",
    "on conflict (user_id) do nothing",
  ];
  if (
    authBody.length === 0 ||
    requiredAuthBody.some(
      (fragment) => !normalizedAuthBody.includes(normalizeSql(fragment)),
    ) ||
    /permanent_account_created/i.test(authBody) ||
    (authStatements.match(/\binsert\s+into\b/gi) ?? []).length !== 1 ||
    /\b(?:update|delete\s+from|truncate|execute|perform|pg_notify)\b/i.test(
      authStatements,
    ) ||
    /\braise\s+(?:notice|log|warning)\b/i.test(authStatements) ||
    /\b(?:sessions|story_artifacts|telemetry|rate_limit|pg_advisory|http|net\.)\b/i.test(
      authBody,
    )
  ) {
    failures.push("Auth trigger is not a narrow, exact, first-evidence-wins Save mutation");
  }

  const lockIndex = normalized.indexOf(
    normalizeSql("lock table auth.users in share row exclusive mode"),
  );
  const triggerIndex = normalized.indexOf(
    normalizeSql("create trigger onward_record_owner_story_save"),
  );
  const foreignKeyIndex = normalized.indexOf(
    normalizeSql(
      "alter table public.owner_story_save_states add constraint owner_story_save_states_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade",
    ),
  );
  const backfillIndex = normalized.indexOf(
    normalizeSql("insert into public.owner_story_save_states"),
    triggerIndex + 1,
  );
  const authTrigger =
    /create\s+trigger\s+onward_record_owner_story_save[\s\S]*?execute\s+function\s+public\.record_owner_story_save_from_auth_v1\(\)\s*;/i.exec(
      migration,
    )?.[0] ?? "";
  if (
    !normalized.includes("set local lock_timeout = '10s'") ||
    !normalized.includes("set local statement_timeout = '30s'") ||
    lockIndex < 0 ||
    foreignKeyIndex < lockIndex ||
    triggerIndex < foreignKeyIndex ||
    triggerIndex < lockIndex ||
    backfillIndex < triggerIndex ||
    !normalizeSql(authTrigger).includes(
      "after update of is_anonymous on auth.users",
    )
  ) {
    failures.push("0022 does not lock, install the Auth trigger, then backfill in one bounded order");
  }

  const backfill = migration.slice(backfillIndex);
  if (
    !normalizeSql(backfill).includes(
      normalizeSql(
        "select existing.id, null, statement_timestamp(), 'legacy_permanent_observed', 'legacy-pre-durable-save-v0'",
      ),
    ) ||
    !normalizeSql(backfill).includes(
      "from auth.users existing where existing.is_anonymous is not true",
    ) ||
    !normalizeSql(backfill).includes("on conflict (user_id) do nothing")
  ) {
    failures.push("0022 backfill fabricates historical save time or omits permanent owners");
  }

  const healthColumnEntries = healthColumns
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const expectedHealthNames = [
    "ok",
    "table_shape_valid",
    "constraints_valid",
    "triggers_enabled",
    "helper_bodies_valid",
    "grants_valid",
    "rls_valid",
    "coverage_valid",
    "rows_valid",
  ];
  if (
    healthDefinition.length === 0 ||
    healthColumnEntries.length !== expectedHealthNames.length ||
    healthColumnEntries.some(
      (entry, index) =>
        normalizeSql(entry) !== `${expectedHealthNames[index]} boolean`,
    ) ||
    !normalizeSql(healthDefinition).includes(
      "security definer set search_path = pg_catalog, public",
    ) ||
    !normalized.includes(
      "revoke all on function public.owner_story_save_schema_health_v1() from public, anon, authenticated",
    ) ||
    !normalized.includes(
      "grant execute on function public.owner_story_save_schema_health_v1() to service_role",
    ) ||
    !normalizeSql(healthDefinition).includes("not exists ( select 1 from auth.users") ||
    !normalizeSql(healthDefinition).includes(
      "not exists ( select 1 from public.owner_story_save_states",
    )
  ) {
    failures.push("0022 health boundary is not service-only, closed, boolean, and coverage-aware");
  }
}

function checkTelemetryReservation(failures: string[]): void {
  const contract = read("../roadmap/telemetry_contract.md");
  const saveCard = read("../components/SaveStoriesCard.tsx");
  const productionFiles = [
    ...walkTypeScript("../app"),
    ...walkTypeScript("../components"),
    ...walkTypeScript("../lib"),
  ].filter(
    (path) =>
      !path.endsWith("telemetry-types.ts") &&
      !path.endsWith("telemetry-schema.ts") &&
      !path.endsWith("telemetry-id.ts") &&
      !path.endsWith("telemetry-store-memory.ts") &&
      !path.endsWith("telemetry-store-supabase.ts"),
  );
  const producer = productionFiles.find((path) =>
    /event\s*:\s*["'](?:story_saved|saved_story_reopened)["']/.test(
      readAbsolute(path),
    ),
  );
  if (
    producer ||
    /recordProductEvent|sendProductEvent|\/api\/telemetry/i.test(saveCard) ||
    !contract.includes("`story_saved`") ||
    !contract.includes("`saved_story_reopened`") ||
    !/contract reservations|remain disabled|not (?:yet )?activated/i.test(contract)
  ) {
    failures.push("save/reopen telemetry is producing before a transaction-derived producer exists");
  }
}

function checkAuthoritativeUi(failures: string[]): void {
  const card = read("../components/SaveStoriesCard.tsx");
  const player = read("../components/StoryPlayer.tsx");
  const storyPage = read("../app/story/[sessionId]/page.tsx");
  const storiesPage = read("../app/stories/page.tsx");
  const signIn = read("../components/SignInForm.tsx");

  const cardHasClosedStatus =
    /OwnerStorySavePresentation/.test(card) &&
    /status\s*===\s*["']saved["']/.test(card) &&
    /status\s*===\s*["']unavailable["']/.test(card);
  const cardHasPendingHonesty =
    /still temporary|remains temporary|not saved yet/i.test(card) &&
    /confirm|confirmation/i.test(card);
  const cardHasAccessibleStatus =
    /aria-labelledby=/.test(card) &&
    /role=["']status["']/.test(card) &&
    /role=["']alert["']/.test(card);
  if (
    !cardHasClosedStatus ||
    !cardHasPendingHonesty ||
    !cardHasAccessibleStatus ||
    /auth\.getSession\s*\(/.test(card) ||
    /owner-story-save-store|@\/lib\/db/.test(card) ||
    /type=["']password["']|new-password/.test(card) ||
    !/account-wide|every story/i.test(card) ||
    !/generated wording/i.test(card) ||
    !/age used to find it/i.test(card) ||
    !/fixed 60-day deadline/i.test(card) ||
    !/sentTo/.test(card) ||
    !/Change email or resend/.test(card) ||
    !/Check again/.test(card) ||
    !/reason:\s*["']read_error["']/.test(card) ||
    !/retryPendingRef/.test(card) ||
    !/stateHeadingRef\.current\?\.focus\(\)/.test(card) ||
    /href=["']\/signin["']/.test(card) ||
    !/aria-invalid=\{\s*requestError\s*===\s*["']email_exists["']/.test(
      card,
    ) ||
    /what you wrote before[^.]{0,120}(?:stays|saved|kept)/i.test(card)
  ) {
    failures.push("Save card does not use server-authoritative status or honest accessible pending copy");
  }

  if (
    !storyPage.includes("getAuthOwnerLifecycle") ||
    !storyPage.includes("getOwnerStorySavePresentation") ||
    !/(?:ownerStorySave|savePresentation)=\{/.test(storyPage) ||
    !player.includes("OwnerStorySavePresentation") ||
    !/<SaveStoriesCard[\s\S]{0,300}(?:initialSaveState|savePresentation)=\{/.test(
      player,
    )
  ) {
    failures.push("story page does not project verified owner Save State through StoryPlayer");
  }

  const hasTemporaryLibraryCopy =
    /temporary stor(?:y|ies)|temporary guest/i.test(storiesPage);
  const hasUnavailableLibraryCopy =
    /couldn.t confirm|can.t confirm|unavailable|try refreshing/i.test(storiesPage);
  if (
    !storiesPage.includes("getAuthOwnerLifecycle") ||
    !storiesPage.includes("getOwnerStorySavePresentation") ||
    !hasTemporaryLibraryCopy ||
    !hasUnavailableLibraryCopy ||
    !/owner\.isAnonymous\s*&&\s*saveState\.status\s*!==\s*["']saved["']/.test(
      storiesPage,
    ) ||
    storiesPage.includes('?? "Saved story"') ||
    storiesPage.includes('aria-label="Saved story pages"') ||
    /(?:session|item)\.feeling/.test(storiesPage) ||
    /what you wrote before[^.]{0,120}(?:stays|saved|kept)/i.test(storiesPage)
  ) {
    failures.push("story library does not distinguish temporary, saved, and integrity-failure states");
  }

  if (
    !/signInWithOtp\s*\(\s*\{[\s\S]*?options\s*:\s*\{\s*shouldCreateUser\s*:\s*false\s*\}/.test(
      signIn,
    ) ||
    /signUp\s*\(/.test(signIn) ||
    !/sentStatusRef/.test(signIn) ||
    !/errorRef/.test(signIn) ||
    !/role=["']status["']/.test(signIn) ||
    !/role=["']alert["']/.test(signIn) ||
    !/focusAfterRender\(sentStatusRef\)/.test(signIn) ||
    !/focusAfterRender\(errorRef\)/.test(signIn)
  ) {
    failures.push("returning-owner sign-in can create a permanent account without informed Save");
  }
}

function checkIntegrationWiring(failures: string[]): void {
  const packageJson = JSON.parse(read("../package.json")) as {
    scripts?: Record<string, unknown>;
  };
  const workflow = read("../.github/workflows/ci.yml");
  const databaseCheck = read("../scripts/check-db.ts");
  const retentionCheck = read("../scripts/check-derived-output-retention.ts");
  const matchHandler = read("../app/api/match/handler.ts");
  const readme = read("../README.md");
  const decision = read("../docs/owner-story-save-decision.md");
  const saveSurface = DERIVED_OUTPUT_SURFACES["owner.save_state"];
  const saveTable = PERSISTENCE_RETENTION_REGISTRY[
    "public.owner_story_save_states"
  ];
  const creationGateIndex = matchHandler.indexOf(
    "await canOwnerCreateStory(owner)",
  );
  if (
    packageJson.scripts?.["check-owner-story-save"] !==
      "tsx scripts/check-owner-story-save.ts" ||
    !workflow.includes("npm run check-owner-story-save") ||
    !databaseCheck.includes('"owner_story_save_schema_health_v1"') ||
    !databaseCheck.includes("all 9 closed health flags") ||
    !retentionCheck.includes('"lib/owner-story-save.ts"') ||
    !matchHandler.includes("canOwnerCreateStory") ||
    creationGateIndex < 0 ||
    creationGateIndex >
      matchHandler.indexOf("const activation = await activateTelemetryFlowForOwner") ||
    creationGateIndex > matchHandler.indexOf("await intake.handleIntake") ||
    /Migration `0022` is also schema-first compatible/i.test(readme) ||
    /The migration is additive and schema-first/i.test(decision) ||
    !/coordinated (?:production )?cutover/i.test(readme) ||
    !/STORY_CREATION_ENABLED=false/.test(readme) ||
    !/returning-only sign-in guard active/i.test(readme) ||
    !/coordinated\s+cutover/i.test(decision) ||
    !/STORY_CREATION_ENABLED=false/.test(decision) ||
    !/Never roll back to a build that allows implicit signup/i.test(decision) ||
    saveSurface.retentionClass !== "owned_story" ||
    !saveSurface.allowedSinks.includes("request_memory") ||
    !saveSurface.allowedSinks.includes("owner_response") ||
    saveTable.join(",") !== "owned_story"
  ) {
    failures.push("Save State checker, live health, CI, or retention registry is not wired");
  }
}

function extractFunctionDefinition(sql: string, name: string): string {
  const startPattern = new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+public\\.${escapeRegExp(name)}\\s*\\(`,
    "i",
  );
  const start = startPattern.exec(sql)?.index ?? -1;
  if (start < 0) return "";
  const marker = /\bas\s+(\$[a-z0-9_]*\$)/i.exec(sql.slice(start));
  if (!marker) return "";
  const bodyStart = start + marker.index + marker[0].length;
  const end = sql.indexOf(marker[1], bodyStart);
  if (end < 0) return "";
  const terminator = sql.indexOf(";", end + marker[1].length);
  return sql.slice(start, terminator < 0 ? end + marker[1].length : terminator + 1);
}

function extractFunctionBody(sql: string, name: string): string {
  const definition = extractFunctionDefinition(sql, name);
  const marker = /\bas\s+(\$[a-z0-9_]*\$)/i.exec(definition);
  if (!marker) return "";
  const start = marker.index + marker[0].length;
  const end = definition.indexOf(marker[1], start);
  return end < 0 ? "" : definition.slice(start, end);
}

function stripComments(value: string): string {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\r\n]*/g, "");
}

function normalizeSql(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripSqlStringLiterals(value: string): string {
  return value.replace(/'(?:''|[^'])*'/g, "''");
}

function splitTopLevelSqlList(value: string): string[] {
  const entries: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: "'" | '"' | null = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (character === quote) {
        if (value[index + 1] === quote) index += 1;
        else quote = null;
      }
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "(") depth += 1;
    else if (character === ")") depth -= 1;
    else if (character === "," && depth === 0) {
      entries.push(value.slice(start, index));
      start = index + 1;
    }
  }
  entries.push(value.slice(start));
  return entries;
}

function walkTypeScript(relativeDirectory: string): string[] {
  const directory = fileURLToPath(new URL(relativeDirectory, import.meta.url));
  const results: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkAbsoluteTypeScript(path));
    } else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      results.push(path);
    }
  }
  return results;
}

function walkAbsoluteTypeScript(directory: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkAbsoluteTypeScript(path));
    } else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      results.push(path);
    }
  }
  return results;
}

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

function readAbsolute(path: string): string {
  return readFileSync(path, "utf8");
}

function throws(fn: () => unknown): boolean {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
