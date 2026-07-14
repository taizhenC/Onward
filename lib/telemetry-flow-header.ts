// One exact, application-owned header carries the opaque signed story-flow ID
// from the server-rendered intake to its match request. It contains no user or
// story data and is never a general-purpose client analytics channel.
export const TELEMETRY_FLOW_HEADER = "x-onward-telemetry-flow-id";
