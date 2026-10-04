# Void publication RPC response diagnosis

Captured 2026-10-04T04:29:49.987Z. Cause reproduced; a minimal HTTP204-only fix is prepared outside deployed source.

The existing migration declares promote_story_spec_v2 RETURNS void. The publisher validates HTTP success and then unconditionally demands a response-body reader. A successful HTTP204 response has no body. The actual Franklin review and publication committed before this reader assertion failed. PUBLICATION-INTERRUPTION-READBACK.json independently records45 valid publications, Franklin row/stage published, the two remaining targets exact drafts, and all prior44/unrelated rows preserved.

The earlier transport test used a JSON null response body. That fixture passed normal parsing and missed the bodyless success response. The new deterministic regression executes the actual extracted request function, first reproduces Empty database response on the unchanged source, then checks the proposed source against the actual SQL void definition.

The proposed change accepts an absent body only for HTTP204, methodPOST, and the exact promote_story_spec_v2 route. All other empty responses still fail. It returns null to the existing promote caller; complete post-RPC catalog/spec/stage validation remains mandatory. The change does not add a retry, change mutation predicates, weaken readback or infer publication from transport success.

Actual offline regression:18 checks passed, including the original red reproduction;17 mocked requests, zero real network, environment, DB, Auth or provider operations. Original publisher SHA b8beb068c8f387cf92f49d4f893c33a839051eca2b09f65f72d70c92dc029482; proposed SHA a2adb8edf2b61662233091b0ea3849c6acb5e10055b41a0b588e81003859d63c. The unique ignored ROOT proposal is docs/research/new-three-2026-10-03/rpc-void-fix-proposal-2026-10-04/publish-owner-approved.ts. The retained regression is docs/research/new-three-2026-10-03/rpc-void-fix-proposal-2026-10-04/repro-void-rpc.cjs.

The original attested MANAGED helper remains unchanged during root recovery. Root retains the original selection and baseline and checks exact state before each bounded retry. A final all-published invocation can finish without duplicate review or promotion writes. This report does not claim final47 publication or authorize an additional mutation. After root records all47 and hands source ownership back, the narrow code correction and regression can enter the receipt PR with normal CI and independent review.

## Resolution qualification — 2026-10-04

Root completed the original-selection recovery to47 valid publications and verified the catalog using unchanged source before authorizing this correction. The minimal HTTP204-only handling is now applied and its source-derived regression is part of the ordinary offline checker:82 checks pass,66 are expected rejections, and TypeScript/ESLint pass. VOID-RPC-FIX-VERIFICATION.json binds final source hashes and the unchanged publication receipt. The initial interruption and red probe remain retained; no original selection, baseline, authority or proof was rewritten.
