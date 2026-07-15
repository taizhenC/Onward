import { NextResponse } from "next/server";
import { createTelemetryFlowId, recordProductEvent } from "@/lib/telemetry";
import {
  TELEMETRY_ENTRY_COOKIE,
  TELEMETRY_ENTRY_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/telemetry-entry-handoff";
import { telemetryFlowBindingEnabled } from "@/lib/telemetry-flow-lifecycle";
import { landingCtaClickedEvent } from "@/lib/telemetry-producers";

export const runtime = "nodejs";

// This is deliberately a fixed-action form endpoint, not a generic analytics
// collector. It reads no body and accepts no caller-selected dimensions.
export async function POST(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/begin", requestUrl), 303);
  response.headers.set("cache-control", "no-store");

  if (
    !telemetryFlowBindingEnabled() ||
    request.headers.get("origin") !== requestUrl.origin
  ) {
    return response;
  }

  try {
    const flowId = createTelemetryFlowId();
    const result = await recordProductEvent({
      flowId,
      event: landingCtaClickedEvent(),
    });
    if (result === "conflict") return response;

    response.cookies.set(TELEMETRY_ENTRY_COOKIE, flowId, {
      httpOnly: true,
      maxAge: TELEMETRY_ENTRY_COOKIE_MAX_AGE_SECONDS,
      path: "/begin",
      sameSite: "lax",
      secure: requestUrl.protocol === "https:",
    });
  } catch {
    // Measurement cannot strand a reader on the landing page.
  }

  return response;
}
