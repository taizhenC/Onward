import { handleMatchRequest } from "./handler";

export const runtime = "nodejs";
// Rerank + opening copy on a slow provider day can stack past Vercel's default
// function timeout; matching must never die mid-flight.
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  return handleMatchRequest(request);
}
