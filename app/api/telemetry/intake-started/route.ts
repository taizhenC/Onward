import { parseTelemetryFlowId } from "@/lib/telemetry-id";
import { TELEMETRY_FLOW_HEADER } from "@/lib/telemetry-flow-header";
import { telemetryFlowBindingEnabled } from "@/lib/telemetry-flow-lifecycle";
import {
  intakeStartedEvent,
  recordLinkedProductEventBestEffort,
} from "@/lib/telemetry-producers";

export const runtime = "nodejs";

type IntakeStartedBody = { viewportBucket: "small" | "large" };

// Visibility-only endpoint: exact one-field JSON, one authenticated flow
// header, no auth/session/body content, and no response payload.
export async function POST(request: Request): Promise<Response> {
  if (!telemetryFlowBindingEnabled()) return noContent();

  const requestUrl = new URL(request.url);
  if (request.headers.get("origin") !== requestUrl.origin) return noContent();

  const body = await parseBody(request);
  if (!body) return new Response(null, { status: 400 });

  const rawFlowId = request.headers.get(TELEMETRY_FLOW_HEADER);
  if (!rawFlowId) return new Response(null, { status: 400 });

  try {
    const flowId = parseTelemetryFlowId(rawFlowId);
    await recordLinkedProductEventBestEffort(
      intakeStartedEvent(body.viewportBucket),
      flowId,
    );
  } catch {
    // Do not expose signature, configuration, or persistence detail to a
    // public visibility endpoint. The intake itself remains fully usable.
  }
  return noContent();
}

async function parseBody(request: Request): Promise<IntakeStartedBody | null> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return null;
  }
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1
  ) {
    return null;
  }
  const viewportBucket = (value as Record<string, unknown>).viewportBucket;
  return viewportBucket === "small" || viewportBucket === "large"
    ? { viewportBucket }
    : null;
}

function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "no-store" },
  });
}
