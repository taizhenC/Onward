import "server-only";

// A permanent story-flow capability disposition. Request boundaries translate
// this to a fresh-journey 409; transient database/provider failures stay 503.
export class TelemetryFlowConflictError extends Error {
  constructor(message = "telemetry flow is no longer usable") {
    super(message);
    this.name = "TelemetryFlowConflictError";
  }
}
