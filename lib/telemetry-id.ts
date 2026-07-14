import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { readStrongSecret } from "./secret-config";
import type {
  DeletionCorrelationId,
  GenerationAttemptId,
  ProductEvent,
  TelemetryEventId,
  TelemetryFlowId,
  TelemetryOccurrenceId,
} from "./telemetry-types";

type TelemetryIdPrefix = "tfl" | "tev" | "toc" | "gat" | "tdl";
type TelemetrySigningKey = Readonly<{ id: string; secret: string }>;

export function issueTelemetryFlowId(): TelemetryFlowId {
  return issueId("tfl") as TelemetryFlowId;
}

export function issueTelemetryEventId(): TelemetryEventId {
  return issueId("tev") as TelemetryEventId;
}

export function issueTelemetryOccurrenceId(): TelemetryOccurrenceId {
  return issueId("toc") as TelemetryOccurrenceId;
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
  const repeatable =
    (flowId === null &&
      event.event !== "deletion_requested" &&
      event.event !== "deletion_completed") ||
    event.event === "flow_failed";
  let correlationId: string;
  let nonceDomain: string;
  if (repeatable) {
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
  const canonicalEvent = JSON.stringify(
    Object.fromEntries(
      Object.entries(event).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
  const nonce = createHash("sha256")
    .update(nonceDomain)
    .update("\0")
    .update(correlationId)
    .update("\0")
    .update(canonicalEvent)
    .digest("hex")
    .slice(0, 32);
  return signedId("tev", nonce, signingKey) as TelemetryEventId;
}

export function parseTelemetryFlowId(value: unknown): TelemetryFlowId {
  return parseSignedId(value, "tfl", "telemetry flow ID") as TelemetryFlowId;
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

function telemetryIdKeys(): readonly TelemetrySigningKey[] {
  const configured = readStrongSecret(["TELEMETRY_ID_SECRET", "IP_HASH_SALT"]);
  let current = configured;
  if (!current && process.env.NODE_ENV === "production") {
    throw new Error(
      "TELEMETRY_ID_SECRET or IP_HASH_SALT is required for signed telemetry IDs",
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
const LOCAL_TELEMETRY_ID_SECRET =
  "onward-local-telemetry-id-secret-not-for-production";
