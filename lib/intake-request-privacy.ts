export type CrisisResourceOrigin =
  | "server_no_write"
  | "server_confirmed_no_story"
  | "local_no_request"
  | "request_may_have_started";

type CurrentMatchRequestOutcome =
  | "not_sent"
  | "may_have_created_story"
  | "confirmed_no_story";

export type MatchRequestPrivacy = Readonly<{
  currentAttempt: CurrentMatchRequestOutcome;
  priorAttemptMayHaveCreatedStory: boolean;
}>;

export const INITIAL_MATCH_REQUEST_PRIVACY: MatchRequestPrivacy = Object.freeze({
  currentAttempt: "not_sent",
  priorAttemptMayHaveCreatedStory: false,
});

export function beginMatchRequest(
  privacy: MatchRequestPrivacy,
): MatchRequestPrivacy {
  return Object.freeze({
    currentAttempt: "may_have_created_story",
    priorAttemptMayHaveCreatedStory:
      privacy.priorAttemptMayHaveCreatedStory ||
      privacy.currentAttempt === "may_have_created_story",
  });
}

export function confirmCurrentRequestCreatedNoStory(
  privacy: MatchRequestPrivacy,
): MatchRequestPrivacy {
  return Object.freeze({
    ...privacy,
    currentAttempt: "confirmed_no_story",
  });
}

export function crisisResourceOrigin(
  privacy: MatchRequestPrivacy,
  currentResponseProvedNoWrite = false,
): CrisisResourceOrigin {
  if (matchRequestMayHaveCreatedStory(privacy)) {
    return "request_may_have_started";
  }
  if (currentResponseProvedNoWrite) return "server_no_write";
  if (privacy.currentAttempt === "confirmed_no_story") {
    return "server_confirmed_no_story";
  }
  return "local_no_request";
}

export function matchRequestMayHaveCreatedStory(
  privacy: MatchRequestPrivacy,
): boolean {
  return (
    privacy.priorAttemptMayHaveCreatedStory ||
    privacy.currentAttempt === "may_have_created_story"
  );
}
