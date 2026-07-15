import "server-only";

import { STORY_FLOW_AUTH_CHALLENGE_TTL_SECONDS } from "./telemetry-id";

export const STORY_FLOW_AUTH_CHALLENGE_COOKIE = "onward_auth_retry";

// The challenge is deliberately HttpOnly and scoped to the one endpoint that
// can consume it. It never enters JavaScript state, browser storage, a URL, or
// the request body. The signed value carries no readable flow or user ID.
export function readStoryFlowAuthChallengeCookie(
  request: Request,
): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== STORY_FLOW_AUTH_CHALLENGE_COOKIE) {
      continue;
    }
    const value = part.slice(separator + 1).trim();
    return value.length > 0 ? value : null;
  }
  return null;
}

export function setStoryFlowAuthChallengeCookie(
  response: Response,
  challenge: string,
  requestUrl: URL,
): Response {
  response.headers.append(
    "set-cookie",
    serializeStoryFlowAuthChallengeCookie(
      challenge,
      STORY_FLOW_AUTH_CHALLENGE_TTL_SECONDS,
      requestUrl,
    ),
  );
  return response;
}

export function retireStoryFlowAuthChallengeCookie(
  response: Response,
  requestUrl: URL,
): Response {
  response.headers.append(
    "set-cookie",
    serializeStoryFlowAuthChallengeCookie("", 0, requestUrl),
  );
  return response;
}

function serializeStoryFlowAuthChallengeCookie(
  value: string,
  maxAge: number,
  requestUrl: URL,
): string {
  const secure =
    process.env.NODE_ENV === "production" || requestUrl.protocol === "https:"
      ? "; Secure"
      : "";
  return `${STORY_FLOW_AUTH_CHALLENGE_COOKIE}=${value}; Max-Age=${maxAge}; Path=/api/match; HttpOnly; SameSite=Strict${secure}`;
}
