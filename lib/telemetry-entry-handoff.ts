import "server-only";

// Short-lived and scoped to the destination page so the opaque flow never
// enters a URL, script-readable browser storage, or unrelated request. The page
// only reads the HttpOnly value; the browser expires it before a normal story
// can complete.
export const TELEMETRY_ENTRY_COOKIE = "onward_entry_flow";
export const TELEMETRY_ENTRY_COOKIE_MAX_AGE_SECONDS = 30;
