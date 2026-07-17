import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  PRODUCT_EVENT_NAMES,
  PRODUCT_EVENT_RETENTION_DAYS,
} from "../lib/telemetry-types";

const MIGRATION_PATH = resolve(
  "supabase/migrations/0017_first_party_telemetry_rollups.sql",
);
const OUTBOX_MIGRATION_PATH = resolve(
  "supabase/migrations/0011_transactional_telemetry_outbox.sql",
);
const FORBIDDEN_HTTP_ROUTE = resolve(
  "app/api/internal/telemetry/outbox/route.ts",
);

async function main(): Promise<void> {
  assert.equal(
    PRODUCT_EVENT_NAMES.length,
    22,
    "the rollup gate must be reviewed when the exact product-event union changes",
  );
  assert.equal(new Set(PRODUCT_EVENT_NAMES).size, PRODUCT_EVENT_NAMES.length);

  const migration = readRequired(MIGRATION_PATH);
  const outboxMigration = readRequired(OUTBOX_MIGRATION_PATH);
  checkIdentifierFreeRollupTable(migration);
  checkDispatchControl(migration);
  checkIdentifierOnlyClaim(migration);
  checkAtomicRollupSettlement(migration);
  checkLegacyCutover(migration);
  checkPerRowDispatcher(migration);
  checkRetryPolicy(outboxMigration, migration);
  checkReportingAndHealth(migration);
  checkSchemaHealth(migration);
  checkRetentionAndCron(migration);
  checkDatabaseAuthority(`${outboxMigration}\n${migration}`, migration);
  checkFirstPartyRuntimeOnly();

  console.log(
    "Telemetry dispatcher OK: default-off ID-only dispatch, atomic first-party daily rollups, private k-suppressed reporting candidate, bounded retry, and closed schema health",
  );
  console.log(
    "Staging-only proof remains required for real Postgres concurrency, lease recovery, deletion races, RLS grants, and cron execution",
  );
}

function checkDispatchControl(migration: string): void {
  const table = extractSqlObject(
    migration,
    /create table public\.telemetry_rollup_dispatch_control\s*\(/i,
    /^\);/m,
    "telemetry_rollup_dispatch_control table",
  );
  assert.match(table, /singleton\s+boolean\s+primary key\s+default\s+true/i);
  assert.match(table, /check\s*\(\s*singleton\s+is\s+true\s*\)/i);
  assert.match(table, /enabled\s+boolean\s+not null\s+default\s+false/i);
  assert.match(
    migration,
    /insert into public\.telemetry_rollup_dispatch_control\s*\(\s*singleton\s*,\s*enabled\s*\)[\s\S]*?values\s*\(\s*true\s*,\s*false\s*\)/i,
    "applying 0017 must leave dispatch disabled",
  );
  assert.match(
    migration,
    /alter table public\.telemetry_rollup_dispatch_control enable row level security/i,
  );
  assert.match(
    migration,
    /alter table public\.telemetry_rollup_dispatch_control force row level security/i,
  );
  assert.match(
    migration,
    /revoke all on table public\.telemetry_rollup_dispatch_control[\s\S]*?from public, anon, authenticated, service_role/i,
  );

  const toggle = extractSqlFunction(
    migration,
    "set_telemetry_rollup_dispatch_enabled_v1",
  );
  assert.match(toggle, /p_enabled\s+boolean/i);
  assert.match(toggle, /if\s+p_enabled\s+is\s+null\s+then/i);
  assert.match(toggle, /set\s+enabled\s*=\s*p_enabled/i);
  assert.match(
    migration,
    /revoke all on function public\.set_telemetry_rollup_dispatch_enabled_v1\(boolean\)[\s\S]*?from public, anon, authenticated/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.set_telemetry_rollup_dispatch_enabled_v1\(boolean\)[\s\S]*?to service_role/i,
  );
}

function checkIdentifierFreeRollupTable(migration: string): void {
  const table = extractSqlObject(
    migration,
    /create table public\.telemetry_event_daily_rollups\s*\(/i,
    /^\);/m,
    "telemetry_event_daily_rollups table",
  );
  const expectedColumns = [
    "bucket_date",
    "schema_version",
    "event_name",
    "dimension_name",
    "dimension_value",
    "event_count",
  ] as const;
  const executableTable = stripSqlComments(table);
  const body = executableTable.slice(
    executableTable.indexOf("(") + 1,
    executableTable.lastIndexOf(")"),
  );
  const definitions = splitTopLevelSqlItems(body);
  const firstConstraintIndex = definitions.findIndex((definition) =>
    /^(?:constraint|primary\s+key)\b/i.test(definition.trim()),
  );
  assert.equal(
    firstConstraintIndex,
    expectedColumns.length,
    "the rollup table must declare exactly six reviewed columns before constraints",
  );
  const columnDefinitions = definitions
    .slice(0, firstConstraintIndex)
    .map((definition) => definition.replace(/\s+/g, " ").trim());
  const actualColumns = columnDefinitions.map((definition) =>
    definition.slice(0, definition.indexOf(" ")),
  );
  assert.deepEqual(
    actualColumns,
    expectedColumns,
    "the rollup must mirror only the exact closed product-event columns",
  );
  const reviewedDeclarations = [
    /^bucket_date date not null$/i,
    /^schema_version text not null check\s*\(/i,
    /^event_name text not null check\s*\(/i,
    /^dimension_name text not null check\s*\(/i,
    /^dimension_value text not null$/i,
    /^event_count bigint not null check\s*\(/i,
  ];
  columnDefinitions.forEach((definition, index) => {
    assert.match(
      definition,
      reviewedDeclarations[index],
      `${expectedColumns[index]} must keep its reviewed SQL type and nullability`,
    );
  });
  assert.match(table, /event_count\s+bigint\s+not null/i);
  assert.match(table, /event_count\s*>?=\s*0|event_count\s*>\s*0/i);

  assert.doesNotMatch(
    executableTable,
    /\b(event_id|flow_id|deletion_id|user_id|session_id|story_id|artifact_id|lease_id)\b/i,
    "rollups must not retain subject, flow, event, deletion, or lease identifiers",
  );
  assert.doesNotMatch(
    executableTable,
    /\b(json|jsonb|payload|metadata|properties|message|stack|cause|request|response|body|feeling|prose|prompt|embedding)\b/i,
    "rollups must not contain generic or sensitive payload surfaces",
  );
  assert.doesNotMatch(
    executableTable,
    /\b(occurred_at|expires_at)\b/i,
    "rollups may retain only the UTC day bucket, not per-event timestamps",
  );
  assert.match(
    table,
    /event_name[\s\S]*check\s*\([\s\S]*event_name\s+in\s*\(/i,
    "rollup event names require a database allowlist",
  );
  assert.match(
    table,
    /dimension_name[\s\S]*check\s*\([\s\S]*dimension_name\s+in\s*\(/i,
    "rollup dimension names require a database allowlist",
  );
  assert.match(
    table,
    /case\s+dimension_name[\s\S]*?else\s+false[\s\S]*?end/i,
    "each dimension requires a closed value domain",
  );
  assert.match(
    table,
    /case\s+event_name[\s\S]*?else\s+false[\s\S]*?end/i,
    "event-to-dimension applicability must be closed in SQL",
  );
  for (const eventName of PRODUCT_EVENT_NAMES) {
    assert.match(
      table,
      new RegExp(`'${escapeRegExp(eventName)}'`),
      `the rollup table must explicitly allowlist ${eventName}`,
    );
    assert.equal(
      [...table.matchAll(new RegExp(`when '${escapeRegExp(eventName)}' then`, "g"))]
        .length,
      1,
      `${eventName} requires exactly one closed exact-shape branch`,
    );
  }
  assert.match(
    table,
    /case\s+dimension_name[\s\S]*?when\s+'all'\s+then\s+dimension_value\s*=\s*'all'/i,
    "every event denominator must use the fixed all/all cell",
  );
  assert.doesNotMatch(
    stripSqlComments(migration),
    /\bdeletion_id\b/i,
    "deletion correlation IDs must never become aggregate dimensions",
  );
}

function checkIdentifierOnlyClaim(migration: string): void {
  const claim = extractSqlFunction(migration, "claim_product_event_outbox_v2");
  const signature = claim.slice(0, claim.indexOf("language"));
  for (const column of ["event_id text", "attempt_count int", "lease_id text"]) {
    assert.match(signature, new RegExp(escapeRegExp(column), "i"));
  }
  assert.doesNotMatch(
    signature,
    /\b(flow_id|event_name|schema_version|occurred_at|expires_at|dimension|payload|metadata)\b/i,
    "the dispatcher may claim identifiers and bounded delivery state only",
  );
  assert.match(claim, /for update(?:\s+of\s+queue)?\s+skip locked/i);
  assert.match(claim, /attempt_count\s*<\s*20/i);
  assert.match(claim, /interval\s+'60 seconds'/i);
  assert.match(claim, /status\s*=\s*'exhausted'/i);

  assert.match(
    claim,
    /terminal_sources\s+as\s+materialized[\s\S]*?for update of event skip locked[\s\S]*?terminal_pointers\s+as\s+materialized[\s\S]*?for update of queue skip locked/i,
    "final-attempt cleanup must lock source before pointer",
  );
  assert.match(
    claim,
    /source_candidates\s+as\s+materialized[\s\S]*?for update of event skip locked[\s\S]*?pointer_candidates\s+as\s+materialized[\s\S]*?for update of queue skip locked/i,
    "claiming must lock source before pointer",
  );

  const updates = [
    ...claim.matchAll(/update\s+public\.product_event_outbox\s+queue\s+set/gi),
  ];
  assert.equal(updates.length, 2, "v2 requires one terminal and one claim update");
  const terminalUpdateIndex = updates[0]?.index;
  const claimUpdateIndex = updates[1]?.index;
  assert(terminalUpdateIndex !== undefined && claimUpdateIndex !== undefined);
  const returnQueryIndex = claim.indexOf("return query", terminalUpdateIndex);
  const terminalUpdate = claim.slice(terminalUpdateIndex, returnQueryIndex);
  const claimUpdate = claim.slice(claimUpdateIndex);
  assertEligibilityRepeated(terminalUpdate, ">=", 20, "terminal update");
  assertEligibilityRepeated(claimUpdate, "<", 20, "claim update");
}

function assertEligibilityRepeated(
  update: string,
  attemptOperator: ">=" | "<",
  attemptCount: number,
  label: string,
): void {
  assert.match(
    update,
    new RegExp(
      `queue\\.attempt_count\\s*${escapeRegExp(attemptOperator)}\\s*${attemptCount}`,
      "i",
    ),
    `${label} must recheck its attempt bound after locking`,
  );
  assert.match(
    update,
    /queue\.status\s*=\s*'pending'[\s\S]*?queue\.next_attempt_at\s*<=\s*statement_timestamp\(\)/i,
    `${label} must recheck pending eligibility after locking`,
  );
  assert.match(
    update,
    /queue\.status\s*=\s*'leased'[\s\S]*?queue\.lease_expires_at\s*<=\s*statement_timestamp\(\)/i,
    `${label} must recheck expired-lease eligibility after locking`,
  );
}

function checkAtomicRollupSettlement(migration: string): void {
  const settle = extractSqlFunction(
    migration,
    "settle_product_event_outbox_rollup_v1",
  );
  assert.match(settle, /for update/i);
  assert.match(settle, /product_event_outbox/i);
  assert.match(settle, /product_events/i);
  assert.match(settle, /lease_id\s*=\s*p_lease_id/i);
  assert.match(settle, /lease_expires_at\s*>\s*statement_timestamp\(\)/i);
  assert.match(settle, /expires_at\s*>\s*statement_timestamp\(\)/i);

  const sourceLockIndex = settle.search(
    /select\s+event\.\*\s+into[\s\S]*?from\s+public\.product_events[\s\S]*?for update/i,
  );
  const queueLockIndex = settle.search(
    /select\s+queue\.\*\s+into[\s\S]*?from\s+public\.product_event_outbox[\s\S]*?for update/i,
  );
  assert(
    sourceLockIndex >= 0 && queueLockIndex > sourceLockIndex,
    "settlement must lock the source before its cascade-owned pointer",
  );

  const rollupIndex = settle.search(
    /insert\s+into\s+public\.telemetry_event_daily_rollups/i,
  );
  const deliveredAfterRollup =
    rollupIndex < 0
      ? -1
      : settle.slice(rollupIndex).search(
          /update\s+public\.product_event_outbox[\s\S]*?status\s*=\s*'delivered'/i,
        );
  const deliveredIndex =
    deliveredAfterRollup < 0 ? -1 : rollupIndex + deliveredAfterRollup;
  assert(
    rollupIndex >= 0 && deliveredIndex > rollupIndex,
    "the same SQL transaction must roll up before marking the pointer delivered",
  );
  assert.match(
    settle,
    /on conflict[\s\S]*do update[\s\S]*event_count\s*=/i,
  );
  assert.match(
    settle,
    /'all'(?:\s*::text)?\s*,\s*'all'/i,
    "settlement must always emit one unsegmented denominator cell",
  );
  let previousDimensionIndex = -1;
  for (const dimension of ROLLUP_DIMENSIONS) {
    const dimensionIndex = settle.indexOf(`'${dimension}'`);
    assert.equal(
      [...settle.matchAll(new RegExp(`'${dimension}'`, "g"))].length,
      1,
      `${dimension} must have one marginal-cell emitter`,
    );
    assert(
      dimensionIndex > previousDimensionIndex,
      `${dimension} must be emitted once in the reviewed fixed dimension order`,
    );
    previousDimensionIndex = dimensionIndex;
  }
  for (const disposition of [
    "aggregated",
    "duplicate",
    "exhausted",
    "stale",
    "not_found",
  ]) {
    assert.match(settle, new RegExp(`'${disposition}'`));
  }
  assert.doesNotMatch(settle, /\b(json|jsonb|payload|metadata|properties)\b/i);
}

function checkLegacyCutover(migration: string): void {
  const cutoverStart = migration.search(
    /lock\s+table\s+public\.product_event_outbox\s+in\s+share\s+row\s+exclusive\s+mode/i,
  );
  const dispatcherStart = migration.search(
    /create\s+or\s+replace\s+function\s+public\.dispatch_product_event_rollups_v1/i,
  );
  assert(cutoverStart >= 0 && dispatcherStart > cutoverStart);
  const cutover = migration.slice(cutoverStart, dispatcherStart);
  assert.match(
    cutover,
    /insert\s+into\s+public\.product_event_outbox\s*\(\s*event_id\s*\)[\s\S]*?select\s+event\.event_id[\s\S]*?from\s+public\.product_events\s+event[\s\S]*?event\.expires_at\s*>\s*statement_timestamp\(\)[\s\S]*?on\s+conflict\s*\(\s*event_id\s*\)\s+do\s+nothing/i,
    "every still-live pre-outbox event must receive a pointer during the atomic cutover",
  );
  const enqueueIndex = cutover.search(
    /insert\s+into\s+public\.product_event_outbox/i,
  );
  const deliveredBackfillIndex = cutover.search(
    /insert\s+into\s+public\.telemetry_event_daily_rollups/i,
  );
  const revokeIndex = cutover.search(
    /revoke\s+execute\s+on\s+function\s+public\.claim_product_event_outbox_v1/i,
  );
  assert(
    enqueueIndex >= 0 &&
      deliveredBackfillIndex > enqueueIndex &&
      revokeIndex > deliveredBackfillIndex,
    "legacy enqueue, delivered backfill, and raw-path revocation must share one ordered cutover",
  );
}

const ROLLUP_DIMENSIONS = [
  "surface",
  "viewport_bucket",
  "auth_method",
  "rate_operation",
  "limit_scope",
  "recipe_id",
  "story_role",
  "match_disposition",
  "confidence_bucket",
  "match_path",
  "age_fallback",
  "boundary_outcome",
  "policy_version",
  "composition_mode",
  "fallback_reason",
  "attempt_bucket",
  "latency_bucket",
  "passage_ordinal",
  "feedback_verdict",
  "alternate_outcome",
  "reopen_age_bucket",
  "deletion_scope",
  "error_domain",
  "error_class",
  "status_bucket",
] as const;

function checkRetryPolicy(
  outboxMigration: string,
  rollupMigration: string,
): void {
  const nack = extractSqlFunction(
    outboxMigration,
    "nack_product_event_outbox_v1",
  );
  for (const seconds of [5, 30, 120, 600, 3600]) {
    assert.match(
      nack,
      new RegExp(`(?:then|else)\\s+${seconds}\\b`),
      `NACK must preserve the reviewed ${seconds}-second retry step`,
    );
  }
  assert.match(nack, /attempt_count\s*>=\s*20[\s\S]*?'exhausted'/i);
  const claim = extractSqlFunction(
    rollupMigration,
    "claim_product_event_outbox_v2",
  );
  assert.match(
    claim,
    /attempt_count\s*>=\s*20/i,
    "an abandoned final lease must become terminal instead of cycling forever",
  );
  assert.match(claim, /status\s*=\s*'exhausted'/i);
}

function checkPerRowDispatcher(migration: string): void {
  const dispatch = extractSqlFunction(
    migration,
    "dispatch_product_event_rollups_v1",
  );
  const signature = dispatch.slice(0, dispatch.indexOf("language"));
  assert.doesNotMatch(
    signature,
    /\b(event_id|flow_id|lease_id|event_name|dimension_name|dimension_value)\b/i,
    "the dispatcher may return counts only",
  );
  for (const count of [
    "claimed_count",
    "aggregated_count",
    "duplicate_count",
    "gone_count",
    "retried_count",
    "settlement_exhausted_count",
    "stale_count",
    "unsettled_count",
  ]) {
    assert.match(signature, new RegExp(`\\b${count}\\s+int\\b`, "i"));
  }
  const executable = stripSqlComments(dispatch);
  assert.match(dispatch, /set\s+lock_timeout\s*=\s*'2s'/i);
  const controlIndex = executable.search(
    /from\s+public\.telemetry_rollup_dispatch_control/i,
  );
  const claimIndex = executable.search(/claim_product_event_outbox_v2/i);
  assert(
    controlIndex >= 0 && claimIndex > controlIndex,
    "the default-off control must gate before any queue claim",
  );
  assert.match(
    executable,
    /from\s+public\.telemetry_rollup_dispatch_control[\s\S]*?for\s+share/i,
    "the control row must remain share-locked until the dispatch transaction drains",
  );
  assert.match(
    executable,
    /if\s+not\s+coalesce\s*\(\s*v_enabled\s*,\s*false\s*\)[\s\S]*?return query select\s+0\s*,\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*,\s*0/i,
  );
  assert.match(executable, /claim_product_event_outbox_v2/i);
  assert.match(executable, /settle_product_event_outbox_rollup_v1/i);
  assert.match(executable, /for\s+[a-z_][a-z0-9_]*\s+in\s+(?:select|execute)/i);
  assert.match(executable, /exception\s+when\s+others/i);
  assert.match(executable, /nack_product_event_outbox_v1/i);
  assert.match(
    executable,
    /nack_product_event_outbox_v1[\s\S]*?'database'/i,
    "per-row failures must reduce to one fixed closed database class",
  );
  assert.doesNotMatch(
    executable,
    /raise\s+(?:notice|warning|log|info)|sqlerrm|sqlstate/i,
    "dispatch must not log or return raw database failures",
  );
}

function checkReportingAndHealth(migration: string): void {
  const reporting = extractSqlFunction(
    migration,
    "read_telemetry_event_rollups_v1",
  );
  assert.match(
    reporting,
    /event_count\s*>=\s*10|having\s+(?:sum\s*\(\s*)?event_count\s*\)?\s*>=\s*10/i,
    "the only reporting boundary must suppress cells smaller than k=10",
  );
  assert.match(
    reporting,
    /28\s*days|interval\s+'28 days'|\b28\b/i,
    "reporting lookback must be fixed to at most 28 days",
  );
  const reportingSignature = reporting.slice(0, reporting.indexOf("language"));
  assert.doesNotMatch(
    reportingSignature,
    /\b(event_id|flow_id|deletion_id|user_id|session_id|artifact_id|lease_id)\b/i,
    "the private candidate may inspect sources internally but may return no identifiers",
  );
  assert.match(reporting, /p_to\s*>\s*v_today\s*-\s*1/i);
  assert.match(
    reporting,
    /from\s+public\.product_events\s+event[\s\S]*?left\s+join\s+public\.product_event_outbox\s+queue[\s\S]*?queue\.event_id\s+is\s+null[\s\S]*?or\s+queue\.status\s*<>\s*'delivered'/i,
    "a day with a missing pointer or unsettled source work must be withheld",
  );
  assert.match(reporting, /unsafe_partitions\s+as\s+materialized/i);
  assert.match(reporting, /having\s+min\s*\(\s*cell\.event_count\s*\)\s*<\s*10/i);
  assert.match(
    reporting,
    /unsafe_events\s+as\s+materialized[\s\S]*?from\s+unsafe_partitions\s+unsafe_partition/i,
    "an unsafe marginal partition must promote to event/day-wide secondary suppression",
  );
  const finalSuppressionIndex = reporting.lastIndexOf("and not exists");
  const orderIndex = reporting.lastIndexOf("order by");
  assert(finalSuppressionIndex >= 0 && orderIndex > finalSuppressionIndex);
  const finalSuppression = reporting.slice(finalSuppressionIndex, orderIndex);
  assert.match(
    finalSuppression,
    /from\s+unsafe_events\s+unsafe[\s\S]*?unsafe\.bucket_date\s*=\s*rollup\.bucket_date[\s\S]*?unsafe\.schema_version\s*=\s*rollup\.schema_version[\s\S]*?unsafe\.event_name\s*=\s*rollup\.event_name/i,
    "unsafe children must suppress every event/day cell including the all/all parent",
  );
  assert.doesNotMatch(
    finalSuppression,
    /dimension_name|dimension_value/i,
    "parent suppression must not be bypassable by a different partition",
  );

  const health = extractSqlFunction(migration, "telemetry_outbox_health_v1");
  const healthSignature = health.slice(0, health.indexOf("language"));
  assert.match(healthSignature, /dispatch_enabled\s+boolean/i);
  for (const status of ["pending", "leased", "delivered", "exhausted"]) {
    assert.match(health, new RegExp(`'${status}'`));
  }
  assert.match(health, /join\s+public\.product_events\s+event/i);
  assert.match(health, /event\.expires_at\s*>\s*statement_timestamp\(\)/i);
  assert.match(
    health,
    /event\.flow_id\s+is\s+null[\s\S]*?from\s+public\.telemetry_flows\s+flow[\s\S]*?flow\.expires_at\s*>\s*statement_timestamp\(\)/i,
    "eligible health must ignore deleted or expired flow work",
  );
  assert.match(healthSignature, /actionable_count\s+bigint/i);
  assert.match(health, /oldest[\s_]*actionable[\s_]*age[\s_]*bucket/i);
  for (const bucket of ["none", "lt1m", "1to5m", "5to15m", "15to60m", "gt60m"]) {
    assert.match(health, new RegExp(`'${bucket}'`));
  }
  assert.doesNotMatch(
    health.slice(0, health.indexOf("language")),
    /\b(event_id|flow_id|lease_id|occurred_at|created_at|next_attempt_at|lease_expires_at)\b/i,
    "health output must contain counts and a closed age bucket only",
  );
}

function checkSchemaHealth(migration: string): void {
  const health = extractSqlFunction(
    migration,
    "telemetry_rollup_schema_health_v1",
  );
  const signature = health.slice(0, health.indexOf("language"));
  const expectedColumns = [
    "ok",
    "dispatch_enabled",
    "tables_forced_rls",
    "raw_paths_revoked",
    "helpers_private",
    "boundaries_granted",
    "cron_jobs_active",
  ] as const;
  const actualColumns = [
    ...signature.matchAll(/^\s{2}([a-z_]+)\s+boolean\b/gm),
  ].map((match) => match[1]);
  assert.deepEqual(
    actualColumns,
    expectedColumns,
    "schema health may expose only the reviewed closed booleans",
  );
  assert.doesNotMatch(
    signature,
    /\b(event_id|flow_id|lease_id|event_name|dimension_name|dimension_value|timestamp|message|error)\b/i,
  );
  assert.match(health, /count\(\*\)\s*=\s*2[\s\S]*?relrowsecurity[\s\S]*?relforcerowsecurity/i);
  assert.match(health, /v_raw_paths_revoked\s*:=/i);
  assert.match(health, /v_helpers_private\s*:=/i);
  assert.match(health, /v_boundaries_granted\s*:=/i);
  for (const role of ["anon", "authenticated", "service_role"]) {
    assert.match(
      health,
      new RegExp(`'${role}'::text`, "i"),
      `schema health must detect effective privilege drift for ${role}`,
    );
  }
  for (const privilege of [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "TRUNCATE",
    "REFERENCES",
    "TRIGGER",
  ]) {
    assert.match(
      health,
      new RegExp(`'${privilege}'::text`, "i"),
      `schema health must detect ${privilege} grants on private tables`,
    );
  }
  assert.match(
    health,
    /has_any_column_privilege\s*\(/i,
    "schema health must detect effective column grants as well as table grants",
  );
  assert.match(
    health,
    /count\(\*\)\s*=\s*2[\s\S]*?bool_and\([\s\S]*?job\.active[\s\S]*?job\.schedule\s*=\s*'\* \* \* \* \*'[\s\S]*?dispatch_product_event_rollups_v1\(25\)[\s\S]*?job\.schedule\s*=\s*'17 4 \* \* \*'[\s\S]*?delete_expired_telemetry_rollups_v1\(\)/i,
    "schema health must pin both cron schedules and commands, not only job names",
  );
  assert.match(
    migration,
    /revoke all on function public\.telemetry_rollup_schema_health_v1\(\)[\s\S]*?from public, anon, authenticated/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.telemetry_rollup_schema_health_v1\(\)[\s\S]*?to service_role/i,
  );
}

function checkRetentionAndCron(migration: string): void {
  assert.equal(PRODUCT_EVENT_RETENTION_DAYS, 30);
  assert.match(
    migration,
    /delete\s+from\s+public\.telemetry_event_daily_rollups[\s\S]*?(?:bucket_date\s*<[\s\S]*?-\s*29|bucket_date\s*\+\s*30\s*<=)/i,
    "rollups must be pruned after no more than 30 calendar days",
  );
  assert.match(migration, /onward-dispatch-product-event-rollups/);
  assert.match(
    migration,
    /cron\.schedule\s*\([\s\S]*?onward-dispatch-product-event-rollups[\s\S]*?'\* \* \* \* \*'[\s\S]*?dispatch_product_event_rollups_v1/i,
    "private pg_cron must dispatch rollups every minute",
  );
  assert.doesNotMatch(
    migration,
    /http_post|net\.http|https?:\/\/|webhook|cron_secret/i,
    "the first-party database worker must not call an external sink",
  );
}

function checkDatabaseAuthority(
  combinedMigrations: string,
  migration: string,
): void {
  for (const table of [
    "telemetry_event_daily_rollups",
    "telemetry_rollup_dispatch_control",
    "product_event_outbox",
  ]) {
    assert.match(
      combinedMigrations,
      new RegExp(`alter table public\\.${table} enable row level security`, "i"),
    );
    assert.match(
      combinedMigrations,
      new RegExp(`alter table public\\.${table} force row level security`, "i"),
    );
  }
  assert.match(
    migration,
    /revoke all on table public\.telemetry_event_daily_rollups[\s\S]*?from public, anon, authenticated, service_role/i,
  );
  for (const rpc of [
    "claim_product_event_outbox_v2",
    "settle_product_event_outbox_rollup_v1",
    "dispatch_product_event_rollups_v1",
    "read_telemetry_event_rollups_v1",
    "telemetry_outbox_health_v1",
    "set_telemetry_rollup_dispatch_enabled_v1",
    "delete_expired_telemetry_rollups_v1",
    "telemetry_rollup_schema_health_v1",
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on function public\\.${rpc}\\(`, "i"),
    );
  }
  for (const rpc of [
    "claim_product_event_outbox_v2",
    "settle_product_event_outbox_rollup_v1",
    "read_telemetry_event_rollups_v1",
  ]) {
    assert.doesNotMatch(
      migration,
      new RegExp(
        `grant execute on function public\\.${rpc}\\([\\s\\S]*?to (?:public|anon|authenticated|service_role)`,
        "i",
      ),
      `${rpc} must remain private to the security-definer dispatcher`,
    );
  }
  for (const rpc of [
    "dispatch_product_event_rollups_v1",
    "telemetry_outbox_health_v1",
    "set_telemetry_rollup_dispatch_enabled_v1",
    "delete_expired_telemetry_rollups_v1",
    "telemetry_rollup_schema_health_v1",
  ]) {
    assert.match(
      migration,
      new RegExp(
        `grant execute on function public\\.${rpc}\\([\\s\\S]*?to service_role`,
        "i",
      ),
    );
  }
  assert.match(
    migration,
    /revoke (?:all|execute) on function public\.claim_product_event_outbox_v1\([\s\S]*?service_role/i,
    "the full-row v1 claim must no longer be executable by service_role",
  );
  assert.match(
    migration,
    /revoke (?:all|execute) on function public\.ack_product_event_outbox_v1\([\s\S]*?service_role/i,
    "plain ACK must not bypass atomic rollup settlement",
  );
}

function checkFirstPartyRuntimeOnly(): void {
  assert(
    !existsSync(FORBIDDEN_HTTP_ROUTE),
    "pure pg_cron dispatch must not expose an HTTP endpoint",
  );
  const runtimePaths = ["app", "components", "lib"].flatMap((root) =>
    listRuntimeSources(resolve(root)),
  );
  const legacyDefinitionPaths = new Set([
    resolve("lib/telemetry.ts"),
    resolve("lib/telemetry-store-supabase.ts"),
  ]);
  const privateDatabaseBoundary =
    /\b(?:telemetry_event_daily_rollups|telemetry_rollup_dispatch_control|claim_product_event_outbox_v2|settle_product_event_outbox_rollup_v1|dispatch_product_event_rollups_v1|read_telemetry_event_rollups_v1|telemetry_outbox_health_v1|set_telemetry_rollup_dispatch_enabled_v1|telemetry_rollup_schema_health_v1)\b/i;
  const legacyRawRuntime =
    /\b(?:claim|ack|nack)(?:Supabase)?ProductEventOutbox\b|\b(?:claim|ack)_product_event_outbox_v1\b/i;
  const commonExternalAnalytics =
    /\b(?:posthog|mixpanel|amplitude|fullstory|segment\.io|analytics_url|sink_url|webhook_url)\b/i;

  for (const path of runtimePaths) {
    const source = readRequired(path);
    assert.doesNotMatch(
      source,
      privateDatabaseBoundary,
      `${path} must not expose or consume the private database dispatcher/reporting surface`,
    );
    assert.doesNotMatch(
      source,
      /\.from\s*\(\s*["'`]product_events["'`]\s*\)/i,
      `${path} must not read raw product events at runtime`,
    );
    if (!legacyDefinitionPaths.has(path)) {
      assert.doesNotMatch(
        source,
        legacyRawRuntime,
        `${path} must not revive the revoked raw claim/ACK worker path`,
      );
    }
    assert.doesNotMatch(
      source,
      commonExternalAnalytics,
      `${path} must not introduce a third-party telemetry sink`,
    );
    if (/product_events|productEventOutbox|telemetry.*(?:rollup|outbox)/i.test(source)) {
      assert.doesNotMatch(
        source,
        /\bfetch\s*\(|https?:\/\/|CRON_SECRET/i,
        `${path} must not transmit product-event or outbox data over HTTP`,
      );
      assert.doesNotMatch(
        source,
        /console\.|logger\.|\.message\b|\.stack\b|\.cause\b/,
        `${path} must not log raw delivery state or exceptions`,
      );
    }
  }
}

function listRuntimeSources(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) return listRuntimeSources(path);
    return entry.isFile() && /\.(?:[cm]?js|jsx|[cm]?ts|tsx)$/i.test(entry.name)
      ? [path]
      : [];
  });
}

function extractSqlFunction(sql: string, name: string): string {
  return extractSqlObject(
    sql,
    new RegExp(`create or replace function public\\.${name}\\(`, "i"),
    /\$fn\$;/,
    `${name} function`,
  );
}

function extractSqlObject(
  source: string,
  startPattern: RegExp,
  endPattern: RegExp,
  label: string,
): string {
  const start = source.search(startPattern);
  assert(start >= 0, `${label} is missing`);
  const remainder = source.slice(start);
  const endMatch = endPattern.exec(remainder);
  assert(endMatch?.index !== undefined, `${label} is unterminated`);
  return remainder.slice(0, endMatch.index + endMatch[0].length);
}

function readRequired(path: string): string {
  assert(existsSync(path), `${path} is missing`);
  return readFileSync(path, "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripSqlComments(value: string): string {
  return value.replace(/--[^\r\n]*/g, "");
}

function splitTopLevelSqlItems(value: string): string[] {
  const items: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "'") {
      if (quoted && value[index + 1] === "'") {
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (quoted) continue;
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      items.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = value.slice(start).trim();
  if (tail.length > 0) items.push(tail);
  assert.equal(depth, 0, "rollup table declarations must balance parentheses");
  assert.equal(quoted, false, "rollup table declarations must close SQL strings");
  return items;
}

void main();
