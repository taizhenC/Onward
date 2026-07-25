# Story-quality evidence

This directory holds metrics-only, content-addressed evidence produced by the
story-quality benchmark. It must never contain participant disclosures, story
prose, reviewer notes, per-case identifiers, or per-case hashes.

## Directory contract

- `history/` contains append-only aggregate evidence that is safe to review in
  Git. The evaluator creates
  `history/<benchmark-version>/<recipe-id>/<evidence-id>.json` with an
  exclusive write, so an existing record cannot be overwritten. Pull-request
  CI requires a regular, non-executable JSON file, parses it, requires this
  exact content-addressed path, and rejects arbitrary JSON or private packet
  material.
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

Protected-holdout custody is a separate external boundary. The repository
contains no trusted custodian key. The protected evaluator environment must
inject the Ed25519 public key as
`STORY_QUALITY_CUSTODIAN_PUBLIC_KEY_PEM`; the private key must never enter the
app, repository, packet, evidence, or ordinary CI. The custodian signature
binds both the complete private packet digest and the deterministic safe-result
digest. Missing external trust or a missing signature keeps an otherwise
perfect run `incomplete`; an invalid signature under supplied trust is
rejected. An unverified packet proof is omitted from public evidence rather
than copied through. Ordinary pull-request CI intentionally has no trust root
and therefore cannot admit a `pass`; a protected, base-owned authority is still
required before signed launch evidence can be committed.

Evidence from synthetic, development, or validation splits can never `pass`,
even when correctly signed. With no critical failure it is `incomplete`; an
observed critical failure remains a `fail`. A protected-holdout `pass` still
has `promotionAuthorized: false`; release authority remains an external,
independently protected process.
