import "server-only";
import { isNiudaFictionRequest, NIUDA_FICTION_ID } from "./fiction-request";
import { isValidIntakeAge, intakeFeelingLength, INTAKE_MAX_FEELING_LENGTH } from "./intake-constraints";
import { parseStoryBoundaries, storyProfileAllowed } from "./story-boundaries";

/**
 * Called only after the route's crisis, incident, runtime and flow checks.
 * A null result leaves historical intake completely unchanged. A non-null
 * result creates no account, Owner Story, telemetry event or provider call.
 */
export function resolveFictionRequest(body: unknown): Response | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  if (typeof input.feeling !== "string" || !isNiudaFictionRequest(input.feeling)) return null;
  const reply = (value: object, status = 200) => Response.json(value, {
    status, headers: { "cache-control": "no-store" },
  });
  if (typeof input.age !== "number" || !isValidIntakeAge(input.age)) {
    return reply({ error: "Age must be a whole number between 18 and 100." }, 400);
  }
  if (intakeFeelingLength(input.feeling) > INTAKE_MAX_FEELING_LENGTH) {
    return reply({ error: "Keep this to 1,000 characters or fewer." }, 400);
  }
  // A recovery capability belongs to the historical request that issued it.
  // Do not consume it, ignore it, or turn it into an entertainment request.
  if (input.recoveryToken !== undefined || input.clarification !== undefined || input.acceptAdjacent !== undefined) {
    return reply({ flowConflict: true }, 409);
  }
  if (Object.keys(input).some(key => !["age", "feeling", "boundaries"].includes(key))) {
    return reply({ error: "Fiction request contains unsupported fields." }, 400);
  }
  const boundaries = parseStoryBoundaries(input.boundaries);
  if ("error" in boundaries) return reply({ error: boundaries.error }, 400);
  if (!storyProfileAllowed({
    intensity: "moderate", flags: ["other_reviewed_flag"],
    contentNote: "Adult innuendo and internet comedy; no graphic description.",
  }, boundaries.value)) {
    return reply({ noEligibleStory: true });
  }
  return reply({ fictionSpecial: NIUDA_FICTION_ID });
}
