# Story-quality evidence

This directory holds metrics-only, content-addressed evidence produced by the
story-quality benchmark. It must never contain participant disclosures, story
prose, reviewer notes, per-case identifiers, or per-case hashes.

## Directory contract

- `history/` contains append-only aggregate evidence that is safe to review in
  Git. The evaluator creates
  `history/<benchmark-version>/<recipe-id>/<evidence-id>.json` with an
  exclusive write, so an existing record cannot be overwritten.
- `private/` is an ignored local mount point for the protected benchmark
  packet. Do not treat `.gitignore` as encryption or access control; the real
  packet belongs in the approved research storage and should be mounted only
  for the evaluation.
- `runs/` is ignored scratch space. It is not an evidence source.

## Controlled evaluation

Set `STORY_QUALITY_RESEARCH_HMAC_KEY` to the research-only secret used to
commit benchmark inputs. It must contain at least 32 UTF-8 bytes. Then run:

```powershell
npm run eval-story-quality -- <protected-packet.json>
```

The runner writes only validated aggregate evidence and prints a closed,
metrics-only result. It never prints the packet path, exception message,
stack, raw content, or generated evidence path. A result other than `pass`
exits non-zero.

Evidence from synthetic, development, or validation splits is always
`incomplete`. Even a protected-holdout `pass` has
`promotionAuthorized: false`; release authority remains an external,
independently protected process.
