# Ten new historical stories — October 2, 2026

**Preserved first research and insertion record.** The ten stories were subsequently rewritten to the story recipe and saved to their existing database drafts. The [finished writing packet](../new-stories-written-2026-10-02/README.md) contains the latest reading copies, independent reviews, verification and replacement receipt. The local editorial JSON paths below now hold those revised inputs; this packet’s original readings, hashes, checks and insertion receipt describe the earlier baseline. Use the finished packet’s verifier for the revised inputs.

Ten new, source-linked historical episodes have been researched, authored and inserted into the connected database as drafts. Each has its own completion document below, created when its author finished. These documents contain the complete reading copy, primary-source URLs and locators, age and scope qualifications, and hashes of the exact candidate and matching-stage files.

Human historical, tone and content review remains pending. Source cross-reviews and successful mechanical checks do not approve publication.

## Story documents

| Story | Bounded episode | Age | Reading document |
| --- | --- | --- | --- |
| Jane Addams | Speaking about her settlement plan, finding a house and moving in, 1888–1889 | 27–29 | [Addams](addams.md) |
| Elizabeth Blackwell | Medical-school applications, admission and first degree, 1847–1849 | 26–27 | [Blackwell](blackwell_e.md) |
| Charles Darwin | Refusing a voyage offer, asking again and beginning preparation, 1831 | 22 | [Darwin](darwin.md) |
| Olaudah Equiano | A freedom request, signed release and continuing racial coercion, 1766 | Approximately 20–21 | [Equiano](equiano.md) |
| Ulysses S. Grant | Illness, unsuccessful work and a salaried family-shop clerkship, 1858–April 1861 | 36–38 | [Grant](grant.md) |
| Harriet Jacobs | Concealment near her children, escape preparations and northern arrival, 1835–1842 | Approximately 20–29 | [Jacobs](jacobs.md) |
| Helen Keller | First language lessons and continuing practice, March–April 1887 | 6 | [Keller](keller.md) |
| Jacob Riis | Unpaid newspaper work, hunger and an accepted reporting trial, 1873 | Approximately 23–24 | [Riis](riis.md) |
| Mary Seacole | Nursing refusals, independent travel and work at the sick wharf, 1854–1855 | 48–49 | [Seacole](seacole.md) |
| Booker T. Washington | Reaching Hampton, admission and early student support, 1872 onward | Approximately 16–17 | [Washington](washington_b.md) |

The reading copies contain 6,949 words across 70 passages. Darwin, Grant and Riis are shorter than the recipe's 700-word target. Grant has a documented but compressed turning event rather than a recorded arrival scene. Keller's dark passage recounts undated recurring frustrations, and Blackwell's application response compresses a sequence with no recorded single location or session. Equiano's struggle explicitly looks backward. These craft limitations remain open for human review. Memoir recollections, uncertain ages, help from other people, commercial activity and morally consequential context remain qualified in the individual documents. No missing action or dialogue was invented to fill the recipe.

## Verification and database insertion

Insertion and exact database read-back completed on October 2, 2026. The [database receipt](DATABASE-RECEIPT.json) verifies ten new figures, ten new draft stages and ten new draft StorySpecs. Counts increased from 50 to 60 figures, 50 to 60 stages and 51 to 61 StorySpecs. Every preexisting catalog row matched the insertion-time snapshot. The 34 stories published at insertion remained published; all ten new stories remain draft with empty review metadata.

The [mechanical verification report](VERIFICATION.json) records strict parsing, draft validation, an in-memory publication simulation, canonical composition and serialized replay for all ten stories. Every check passed with zero errors and warnings; saved drafts contain no simulated reviewer metadata. TypeScript checking and ESLint also passed.

All 22 database checks passed, including serving parity, published-story integrity and closed schema probes; see [database health output](DATABASE-HEALTH.txt). The initial health-check attempt stopped because local configuration lacked `TELEMETRY_ID_SECRET`. The successful run supplied a random temporary process-only test secret for the non-writing probes. No environment file was edited, and this result does not establish a configured production telemetry secret.

Independent source reviews are saved alongside this packet: [education](CROSS-REVIEW-EDUCATION.md), [vocation](CROSS-REVIEW-VOCATION.md), [Riis/Jacobs/Equiano](CROSS-REVIEW-RESILIENCE.md) and [Seacole](CROSS-REVIEW-SEACOLE.md). Their factual corrections were verified against the final input hashes. They preserve the craft limitations and pending human publication decisions.

Candidate and stage JSON files remain in the existing local editorial workspace, `docs/research/new-stories-2026-10-02/`. The readable completion documents are saved in this folder. The offline verifier and insert-only importer are [check-and-seed.ts](check-and-seed.ts):

```powershell
node --import tsx docs/releases/new-stories-2026-10-02/check-and-seed.ts
```

The importer requires exactly ten unique new figures, matching stage/story identities and ages, the existing theme vocabulary, complete current reading documents, empty review metadata, strict parsing and validation, canonical composition and serialized replay. Database writes require its separate `--write` argument and configured server credentials. It sequences parent figures, draft stages and draft StorySpecs, ignores only exact duplicate targets for recovery, reads every target back and compares all preexisting catalog content. It never invokes publication functions.

Publication would additionally require human reading decisions and an evaluated library release integrating the new episodes. The installed library, keyword routes, evaluation labels, embeddings, recipe manifests and reader behavior are outside this draft addition.
