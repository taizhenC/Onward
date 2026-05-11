import { jsonError } from "@/lib/api-utils";
import { handleIntake } from "@/lib/intake";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const result = handleIntake(body);

  if ("error" in result) {
    return jsonError(result.error, 400);
  }

  return Response.json(result);
}
