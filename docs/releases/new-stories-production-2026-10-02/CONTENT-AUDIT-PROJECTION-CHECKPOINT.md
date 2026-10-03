# Initial catalog audit checkpoint

Read-only verification on 2026-10-03 UTC at commit `eef56ead68dfd2bc318d02d371baa6db8edcde91`. This supplements the initial `CONTENT-AUDIT.md`; it does not rewrite that audit or its pending findings.

The frozen `PROJECTED-CATALOG.json` bytes now match on disk and in `HEAD`: SHA-256 `17336b720af3aaf5ae623043e38c118187f8f2565c3a740a0c3f70e68b88b6e4`. The scoped packet `.gitattributes` rule preserves these exact bytes. The earlier checkout/commit newline mismatch is resolved without changing the frozen v1 checker or its expected hash.

The first real supplemental v1 measurement is complete and remains a failure: `MATCHING-EXTENSION-projected44-d22d9270-2706-48ee-94e6-22b398fbe772.json`, 18/20 overall, 16/18 adult cases, 2/2 under-18 diagnostics, zero transport/deadline failures, no keyword fallback. All nine adult-age-reachable figures have at least one observed correct adult case. Keller remains unreachable through the normal adult age gate; its two age-six cases are diagnostics.

The two predeclared shortlist failures remain wrong and are counted as wrong: case13 expects Riis but chooses Butler medium/partial; case17 expects Washington but chooses Andersen high/definitive. Both have `expectedSurvived:false`. The receipt reports one definitive wrong, `ok:false`, `authoritative:false`, and `promotable:false`. No alternate label or enlarged acceptance set was used. This run did not include the optional untouched-original-case slice; `existingOriginal104` is null.

The receipt identifies initial library `dd4999537dc39fb45cf31b9bd67d76e8e866fe97eae2b136c1e88c18c2cdfb5a`, frozen v1 checker `f1557ee1c1a5536aebd2953bfa874b7c1cbebfedc24e5fba93683e50fb620203`, frozen twenty-case extension `203a6e2c69a23525fa733fe0bd481f6f4026c00b9a75a54b5fd27a5e2e5d17f7`, unchanged original gold `f87962a57990f65a8765afdcd141bbdd1c3b9f5a965d04f4810f1787d8aa2a1e`, and unchanged recipe manifest `c2ced0eefa65351dc57a17f14dd76abf575745dafaac0d6d8699a95d5a21de52`. Per-trial keys contain no feeling, provider body, prompt, resonance, gap, or credential output.

The initial new60 official original104 gate failed separately, as recorded in `REGRESSION-DIAGNOSIS.md`. Neither this supplemental result nor the passing original50 baseline authorizes publication of the initial new60. A proposed facts-only v2 catalog and separately named v2 checker must preserve this initial record and receive their own exact-input measurements.
