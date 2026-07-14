import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { readStrongSecret } from "./secret-config";
import { TELEMETRY_FLOW_RETENTION_DAYS } from "./telemetry-types";
import type {
  DeletionCorrelationId,
  GenerationAttemptId,
  ProductEvent,
  TelemetryEventId,
  TelemetryFlowId,
  TelemetryOccurrenceId,
  TelemetryOutboxLeaseId,
} from "./telemetry-types";

type TelemetryIdPrefix = "tfl" | "tev" | "toc" | "gat" | "tdl";
type TelemetrySigningKey = Readonly<{ id: string; secret: string }>;

export function issueTelemetryFlowId(now = new Date()): TelemetryFlowId {
  const issuedAtSeconds = Math.floor(now.getTime() / 1000);
  if (!Number.isSafeInteger(issuedAtSeconds) || issuedAtSeconds < 0) {
    throw new Error("telemetry flow issuance time is invalid");
  }
  const nonce =
    issuedAtSeconds.toString(16).padStart(FLOW_TIMESTAMP_HEX_LENGTH, "0") +
    randomBytes(FLOW_RANDOM_BYTES).toString("hex");
  if (nonce.length !== 32) {
    throw new Error("telemetry flow issuance time is out of range");
  }
  return signedId("tfl", nonce, telemetryIdKeys()[0]) as TelemetryFlowId;
}

export function issueTelemetryEventId(): TelemetryEventId {
  return issueId("tev") as TelemetryEventId;
}

export function issueTelemetryOccurrenceId(): TelemetryOccurrenceId {
  return issueId("toc") as TelemetryOccurrenceId;
}

export function issueTelemetryOutboxLeaseId(): TelemetryOutboxLeaseId {
  return randomBytes(16).toString("hex") as TelemetryOutboxLeaseId;
}

export function issueGenerationAttemptId(): GenerationAttemptId {
  return issueId("gat") as GenerationAttemptId;
}

export function issueDeletionCorrelationId(): DeletionCorrelationId {
  return issueId("tdl") as DeletionCorrelationId;
}

export function deriveProductEventId(
  event: Readonly<ProductEvent>,
  flowId: TelemetryFlowId | null,
  occurrenceId?: TelemetryOccurrenceId,
): TelemetryEventId {
  const occurrenceOwned =
    (flowId === null &&
      event.event !== "deletion_requested" &&
      event.event !== "deletion_completed") ||
    event.event === "flow_failed";
  let correlationId: string;
  let nonceDomain: string;
  if (occurrenceOwned) {
    if (occurrenceId === undefined) {
      throw new Error(
        `${event.event} requires one outbox-owned telemetry occurrence ID`,
      );
    }
    correlationId = parseTelemetryOccurrenceId(occurrenceId);
    nonceDomain = OCCURRENCE_EVENT_ID_DOMAIN;
  } else {
    if (occurrenceId !== undefined) {
      throw new Error(`${event.event} uses a deterministic telemetry event ID`);
    }
    correlationId =
      event.event === "deletion_requested" || event.event === "deletion_completed"
        ? parseDeletionCorrelationId(event.deletionId)
        : parseTelemetryFlowId(flowId);
    nonceDomain = PRODUCT_EVENT_ID_DOMAIN;
  }
  const signingKey = signingKeyForId(correlationId);
  const semanticUnit = occurrenceOwned
    ? OCCURRENCE_SEMANTIC_UNIT
    : JSON.stringify(productEventSemanticUnit(event));
  const nonce = createHash("sha256")
    .update(nonceDomain)
    .update("\0")
    .update(correlationId)
    .update("\0")
    .update(semanticUnit)
    .digest("hex")
    .slice(0, 32);
  return signedId("tev", nonce, signingKey) as TelemetryEventId;
}

// Mirrors the partial unique indexes in migration 0011. The event ID is
// normally derived from this unit, but exposing the unit separately lets the
// memory provider reject a caller-supplied second valid ID exactly as Postgres
// does. Unlinkable occurrence events have no durable flow-scoped unit.
export function deriveProductEventSemanticKey(
  event: Readonly<ProductEvent>,
  flowId: TelemetryFlowId | null,
): string | null {
  if (flowId === null || event.event === "flow_failed") return null;
  return JSON.stringify([
    parseTelemetryFlowId(flowId),
    productEventSemanticUnit(event),
  ]);
}

export function parseTelemetryOutboxLeaseId(
  value: unknown,
): TelemetryOutboxLeaseId {
  if (typeof value !== "string" || !/^[0-9a-f]{32}$/.test(value)) {
    throw new Error("telemetry outbox lease ID is invalid");
  }
  return value as TelemetryOutboxLeaseId;
}

export function parseTelemetryFlowId(
  value: unknown,
  now = new Date(),
): TelemetryFlowId {
  const flowId = parseSignedId(
    value,
    "tfl",
    "telemetry flow ID",
  ) as TelemetryFlowId;
  const issuedAtSeconds = telemetryFlowIssuedAtSeconds(flowId);
  const nowSeconds = Math.floor(now.getTime() / 1000);
  if (!Number.isSafeInteger(nowSeconds)) {
    throw new Error("telemetry flow validation time is invalid");
  }
  if (issuedAtSeconds > nowSeconds + FLOW_CLOCK_SKEW_SECONDS) {
    throw new Error("telemetry flow ID was issued in the future");
  }
  if (issuedAtSeconds + TELEMETRY_FLOW_RETENTION_SECONDS <= nowSeconds) {
    throw new Error("telemetry flow ID has expired");
  }
  return flowId;
}

// Privacy cleanup may run after the capability's active window. It still must
// authenticate the opaque identifier, but must not let the normal age guard
// prevent deletion while database cleanup is catching up.
export function parseTelemetryFlowIdForRetirement(
  value: unknown,
): TelemetryFlowId {
  const flowId = parseSignedId(
    value,
    "tfl",
    "telemetry flow ID",
  ) as TelemetryFlowId;
  telemetryFlowIssuedAtSeconds(flowId);
  return flowId;
}

export function telemetryFlowExpiresAt(flowId: TelemetryFlowId): Date {
  const issuedAtSeconds = telemetryFlowIssuedAtSeconds(flowId);
  return new Date(
    (issuedAtSeconds + TELEMETRY_FLOW_RETENTION_SECONDS) * 1000,
  );
}

export function parseTelemetryEventId(value: unknown): TelemetryEventId {
  return parseSignedId(value, "tev", "telemetry event ID") as TelemetryEventId;
}

export function parseTelemetryOccurrenceId(
  value: unknown,
): TelemetryOccurrenceId {
  return parseSignedId(
    value,
    "toc",
    "telemetry occurrence ID",
  ) as TelemetryOccurrenceId;
}

export function parseGenerationAttemptId(value: unknown): GenerationAttemptId {
  return parseSignedId(
    value,
    "gat",
    "generation attempt ID",
  ) as GenerationAttemptId;
}

export function parseDeletionCorrelationId(
  value: unknown,
): DeletionCorrelationId {
  return parseSignedId(
    value,
    "tdl",
    "deletion correlation ID",
  ) as DeletionCorrelationId;
}

function issueId(prefix: TelemetryIdPrefix): string {
  return signedId(
    prefix,
    randomBytes(16).toString("hex"),
    telemetryIdKeys()[0],
  );
}

function signedId(
  prefix: TelemetryIdPrefix,
  nonce: string,
  key: TelemetrySigningKey,
): string {
  const signature = createHmac("sha256", key.secret)
    .update(ID_SIGNATURE_DOMAIN)
    .update("\0")
    .update(prefix)
    .update("\0")
    .update(key.id)
    .update("\0")
    .update(nonce)
    .digest("hex");
  return `${prefix}_${key.id}_${nonce}_${signature}`;
}

function parseSignedId(
  value: unknown,
  prefix: TelemetryIdPrefix,
  label: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`${label} is not a signed telemetry identifier`);
  }
  const match = new RegExp(
    `^${prefix}_([0-9a-f]{16})_([0-9a-f]{32})_([0-9a-f]{64})$`,
  ).exec(value);
  if (!match) throw new Error(`${label} is not a signed telemetry identifier`);
  const key = telemetryIdKeys().find((candidate) => candidate.id === match[1]);
  if (!key) throw new Error(`${label} signing key is not active`);
  const expected = signedId(prefix, match[2], key);
  if (
    !timingSafeEqual(Buffer.from(value, "utf8"), Buffer.from(expected, "utf8"))
  ) {
    throw new Error(`${label} signature is invalid`);
  }
  return value;
}

function signingKeyForId(value: string): TelemetrySigningKey {
  const keyId = value.split("_", 3)[1];
  const key = telemetryIdKeys().find((candidate) => candidate.id === keyId);
  if (!key) throw new Error("telemetry identifier signing key is not active");
  return key;
}

function productEventSemanticUnit(
  event: Readonly<ProductEvent>,
): Readonly<Record<string, string | number>> {
  switch (event.event) {
    case "match_completed":
      // A clarification/no-close result and a later closed match are distinct
      // semantic transitions. All calibration dimensions within that transition
      // remain first-write-wins.
      return {
        event: event.event,
        storyRole: event.storyRole,
        disposition: event.disposition,
      };
    case "artifact_created":
    case "first_content_shown":
    case "story_completed":
    case "source_opened":
    case "feedback_submitted":
    case "story_saved":
      return { event: event.event, storyRole: event.storyRole };
    case "passage_acknowledged":
    case "passage_presented":
      return {
        event: event.event,
        storyRole: event.storyRole,
        passageOrdinal: event.passageOrdinal,
      };
    case "saved_story_reopened":
      // The contract permits one reopen in each age window for a story unit.
      return {
        event: event.event,
        storyRole: event.storyRole,
        ageBucket: event.ageBucket,
      };
    default:
      // Every other field is a measured dimension. Keeping it out of the ID
      // makes a divergent retry collide with the first accepted measurement.
      return { event: event.event };
  }
}

function telemetryIdKeys(): readonly TelemetrySigningKey[] {
  const configured = readStrongSecret(["TELEMETRY_ID_SECRET"]);
  let current = configured;
  if (
    !current &&
    (process.env.NODE_ENV === "production" ||
      process.env.PERSISTENCE?.trim().toLowerCase() === "supabase")
  ) {
    throw new Error(
      "TELEMETRY_ID_SECRET is required for signed telemetry IDs in Supabase/production mode",
    );
  }
  current ??= LOCAL_TELEMETRY_ID_SECRET;
  const secrets = [current, ...previousTelemetryIdSecrets()];
  const keys = new Map<string, TelemetrySigningKey>();
  for (const secret of secrets) {
    const key = Object.freeze({ id: telemetryKeyId(secret), secret });
    const existing = keys.get(key.id);
    if (existing && existing.secret !== secret) {
      throw new Error("telemetry signing key ID collision");
    }
    keys.set(key.id, key);
  }
  return Object.freeze([...keys.values()]);
}

function previousTelemetryIdSecrets(): readonly string[] {
  const raw = process.env.TELEMETRY_ID_PREVIOUS_SECRETS;
  if (raw === undefined || raw === "") return [];
  const values = raw.split(",");
  if (values.length > 8) {
    throw new Error("TELEMETRY_ID_PREVIOUS_SECRETS accepts at most 8 keys");
  }
  return values.map((item) => {
    const value = item.trim();
    if (Buffer.byteLength(value, "utf8") < 32) {
      throw new Error(
        "each TELEMETRY_ID_PREVIOUS_SECRETS key must contain at least 32 bytes",
      );
    }
    return value;
  });
}

function telemetryKeyId(secret: string): string {
  return createHmac("sha256", secret)
    .update(KEY_ID_DOMAIN)
    .digest("hex")
    .slice(0, 16);
}

const ID_SIGNATURE_DOMAIN = "onward:telemetry-id:v1";
const KEY_ID_DOMAIN = "onward:telemetry-key-id:v1";
const PRODUCT_EVENT_ID_DOMAIN = "onward:product-event:v1";
const OCCURRENCE_EVENT_ID_DOMAIN = "onward:occurrence-event:v1";
const OCCURRENCE_SEMANTIC_UNIT = "one-occurrence";
const FLOW_TIMESTAMP_HEX_LENGTH = 12;
const FLOW_RANDOM_BYTES = 10;
const FLOW_CLOCK_SKEW_SECONDS = 5 * 60;
const TELEMETRY_FLOW_RETENTION_SECONDS =
  TELEMETRY_FLOW_RETENTION_DAYS * 24 * 60 * 60;
const LOCAL_TELEMETRY_ID_SECRET =
  "onward-local-telemetry-id-secret-not-for-production";

function telemetryFlowIssuedAtSeconds(flowId: TelemetryFlowId): number {
  const nonce = flowId.split("_", 4)[2];
  const issuedAtSeconds = Number.parseInt(
    nonce.slice(0, FLOW_TIMESTAMP_HEX_LENGTH),
    16,
  );
  if (!Number.isSafeInteger(issuedAtSeconds)) {
    throw new Error("telemetry flow ID issuance time is invalid");
  }
  return issuedAtSeconds;
}
