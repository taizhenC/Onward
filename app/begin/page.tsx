import { IntakeForm } from "@/components/IntakeForm";
import { cookies } from "next/headers";
import { createTelemetryFlowId } from "@/lib/telemetry";
import { TELEMETRY_ENTRY_COOKIE } from "@/lib/telemetry-entry-handoff";
import { telemetryFlowBindingEnabled } from "@/lib/telemetry-flow-lifecycle";
import { parseTelemetryFlowId } from "@/lib/telemetry-id";
import { CRISIS_RESOURCES } from "@/lib/safety";

// Every visit begins a new, unlinkable story journey. This page must not be
// statically cached or two readers could receive the same signed flow ID.
export const dynamic = "force-dynamic";

export default async function BeginPage() {
  // Crisis-capable intake must still render if observability configuration is
  // unavailable. Non-crisis creation can then use the explicit legacy path.
  let telemetryFlowId = null;
  if (telemetryFlowBindingEnabled()) {
    try {
      const handoff = (await cookies()).get(TELEMETRY_ENTRY_COOKIE)?.value;
      telemetryFlowId = handoff
        ? parseTelemetryFlowId(handoff)
        : createTelemetryFlowId();
    } catch {
      try {
        telemetryFlowId = createTelemetryFlowId();
      } catch {
        telemetryFlowId = null;
      }
    }
  }

  return (
    <main className="mx-auto max-w-[36rem] px-6 py-24">
      <IntakeForm
        telemetryFlowId={telemetryFlowId}
        reviewedCrisisResources={CRISIS_RESOURCES}
      />
    </main>
  );
}
