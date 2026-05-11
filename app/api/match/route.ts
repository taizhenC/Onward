import { handleIntake } from "@/lib/intake";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const result = handleIntake(body);

  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
