import "./_smoke-bootstrap";
import { readFileSync } from "node:fs";
import {
  evaluateStoryQualityPacket,
  StoryQualityError,
  writeStoryQualityEvidence,
} from "./story-quality-evidence";

const HMAC_ENV = "STORY_QUALITY_RESEARCH_HMAC_KEY";
const MINIMUM_HMAC_SECRET_BYTES = 32;

type RunnerResult = Readonly<{
  evidenceId: string;
  status: "incomplete" | "fail" | "pass";
  promotionAuthorized: false;
  failureReasons: readonly string[];
  incompleteReasons: readonly string[];
}>;

function closedFailure(code: string): never {
  process.stderr.write(
    `${JSON.stringify({
      status: "error",
      code,
      evidenceWritten: false,
    })}\n`,
  );
  process.exit(1);
}

function packetPathFromArguments(): string {
  const argumentsAfterScript = process.argv.slice(2);
  if (
    argumentsAfterScript.length !== 1 ||
    !argumentsAfterScript[0]?.trim()
  ) {
    closedFailure("packet_path_required");
  }
  return argumentsAfterScript[0];
}

function researchSecretFromEnvironment(): string {
  const secret = process.env[HMAC_ENV];
  if (
    !secret ||
    Buffer.byteLength(secret, "utf8") < MINIMUM_HMAC_SECRET_BYTES
  ) {
    closedFailure("research_hmac_key_invalid");
  }
  return secret;
}

function readPacket(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch {
    closedFailure("packet_read_failed");
  }
}

function safeResult(
  evidence: ReturnType<typeof evaluateStoryQualityPacket>,
): RunnerResult {
  return {
    evidenceId: evidence.evidenceId,
    status: evidence.status,
    promotionAuthorized: false,
    failureReasons: evidence.failureReasons,
    incompleteReasons: evidence.incompleteReasons,
  };
}

function main(): void {
  try {
    const packet = readPacket(packetPathFromArguments());
    const evidence = evaluateStoryQualityPacket(packet, {
      hmacSecret: researchSecretFromEnvironment(),
    });
    writeStoryQualityEvidence(evidence);
    process.stdout.write(`${JSON.stringify(safeResult(evidence))}\n`);
    process.exitCode = evidence.status === "pass" ? 0 : 1;
  } catch (error) {
    closedFailure(
      error instanceof StoryQualityError
        ? error.code
        : "evaluation_failed",
    );
  }
}

main();
