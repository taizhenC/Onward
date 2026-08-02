import assert from "node:assert/strict";

import {
  acknowledgeStoryPassage,
  beatFailureFromStatus,
  beatFailureRecovery,
  parseStoryAdvance,
} from "../lib/story-beat-network";

async function main() {
  assert.equal(beatFailureFromStatus(404), "notfound");
  assert.equal(beatFailureRecovery("notfound"), "restart");
  assert.equal(beatFailureFromStatus(409), "conflict");
  assert.equal(beatFailureRecovery("conflict"), "reload");

  for (const status of [500, 502, 503, 504]) {
    assert.equal(beatFailureFromStatus(status), "transient");
    assert.equal(beatFailureRecovery(beatFailureFromStatus(status)), "retry");
  }
  assert.equal(beatFailureRecovery("connection"), "retry");
  assert.equal(beatFailureRecovery(beatFailureFromStatus(400)), "retry");

  assert.equal(parseStoryAdvance("chunk"), "chunk");
  assert.equal(parseStoryAdvance("beat"), "beat");
  assert.equal(parseStoryAdvance("end"), "end");
  assert.equal(parseStoryAdvance("unexpected"), null);
  assert.equal(parseStoryAdvance(null), null);

  const requests: Array<{
    url: string;
    body: unknown;
  }> = [];
  let attempt = 0;
  const lostThenRecoveredFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    attempt += 1;
    if (attempt === 1) {
      // Models the server committing the ACK while the response is lost.
      throw new TypeError("connection closed after request");
    }
    // The real endpoint returns the same next step for "already_advanced".
    return Response.json({ next: "beat" });
  };

  const acknowledgement = {
    sessionId: "session-resilience-check",
    beatIndex: 2,
    chunkIndex: 1,
  };
  const lostResponse = await acknowledgeStoryPassage(
    acknowledgement,
    lostThenRecoveredFetch,
  );
  assert.deepEqual(lostResponse, { ok: false, kind: "connection" });
  assert.equal(beatFailureRecovery(lostResponse.kind), "retry");

  const recovered = await acknowledgeStoryPassage(
    acknowledgement,
    lostThenRecoveredFetch,
  );
  assert.deepEqual(recovered, { ok: true, next: "beat" });
  assert.equal(requests.length, 2);
  assert.deepEqual(
    requests[1],
    requests[0],
    "a lost ACK response must retry the exact same idempotent position",
  );

  const conflict = await acknowledgeStoryPassage(
    acknowledgement,
    async () => new Response(null, { status: 409 }),
  );
  assert.deepEqual(conflict, { ok: false, kind: "conflict" });
  assert.equal(beatFailureRecovery(conflict.kind), "reload");

  const malformedAcknowledgement = await acknowledgeStoryPassage(
    acknowledgement,
    async () => Response.json({ next: "unexpected" }),
  );
  assert.deepEqual(malformedAcknowledgement, { ok: false, kind: "generic" });
  assert.equal(beatFailureRecovery(malformedAcknowledgement.kind), "retry");

  const missingAcknowledgement = await acknowledgeStoryPassage(
    acknowledgement,
    async () => Response.json({}),
  );
  assert.deepEqual(missingAcknowledgement, { ok: false, kind: "generic" });

  const invalidJsonAcknowledgement = await acknowledgeStoryPassage(
    acknowledgement,
    async () =>
      new Response("{not-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  assert.deepEqual(invalidJsonAcknowledgement, {
    ok: false,
    kind: "generic",
  });

  console.log("Story beat resilience checks passed.");
}

void main();
